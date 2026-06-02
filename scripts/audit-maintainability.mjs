import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const writeContracts = process.argv.includes("--write-contracts");
const config = readJson("scripts/maintainability.config.json", {});
const ignoredSegments = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "dist-bundle",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".vite",
  "target",
  "gen",
  "release",
  ".desktop-runtime",
  ...(config.ignoredSegments ?? [])
]);
const sourceExtensions = new Set(
  config.sourceExtensions ?? [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".rs", ".css", ".scss"]
);
const styleExtensions = new Set([".css", ".scss", ".sass", ".less"]);
const generatedPatterns = (config.generatedPatterns ?? [
  "dist/",
  "dist-bundle/",
  "/dist/",
  "/build/",
  "/out/",
  "/target/",
  "/gen/",
  "*.tsbuildinfo",
  "vite-env.d.ts",
  "next-env.d.ts"
]).map((pattern) => pattern.replaceAll("\\", "/"));
const allowedGenerated = new Set((config.allowedGenerated ?? []).map(normalizePath));
const specificFileBudgets = config.specificFileBudgets ?? {};
const maxImpl = Number(config.maxImplementationFileLines ?? 525);
const maxStyle = Number(config.maxStyleFileLines ?? 400);
const maxAppShell = Number(config.maxAppShellLines ?? 350);
const maxDesktopMain = Number(config.maxDesktopMainLines ?? 450);
const maxDomainBarrel = Number(config.maxDomainBarrelLines ?? 250);
const nearLineMargin = Number(config.nearBudgetMarginLines ?? 25);
const nearAssetMarginBytes = Number(config.nearBudgetMarginKb ?? 4) * 1024;

function readJson(relativePath, fallback) {
  const absolute = path.join(root, relativePath);
  return fs.existsSync(absolute) ? JSON.parse(fs.readFileSync(absolute, "utf8")) : fallback;
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredSegments.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, files);
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

function walkAll(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredSegments.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkAll(absolute, files);
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function relative(file) {
  return normalizePath(path.relative(root, file));
}

function lineCount(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/u).length;
}

function matchesPattern(file, pattern) {
  if (pattern.startsWith("*.")) return file.endsWith(pattern.slice(1));
  return file === pattern || file.includes(pattern);
}

function budgetFor(record) {
  if (specificFileBudgets[record.file]) return Number(specificFileBudgets[record.file]);
  const isAppShell = /(^|\/)(App|AppRoot)\.(tsx|jsx|ts|js)$/.test(record.file);
  const isDesktopMain =
    /(^|\/)(main|lib)\.(cjs|mjs|js|ts|rs)$/.test(record.file) &&
    /desktop|tauri|src-tauri/.test(record.file);
  const isDomainBarrel = /(^|\/)packages\/[^/]+\/src\/index\.ts$/.test(record.file);
  if (isAppShell) return maxAppShell;
  if (isDesktopMain) return maxDesktopMain;
  if (isDomainBarrel) return maxDomainBarrel;
  return styleExtensions.has(record.ext) ? maxStyle : maxImpl;
}

function splitExportBlock(block) {
  return block
    .split(",")
    .map((part) => part.trim().split(/\s+as\s+/u)[0]?.trim())
    .filter(Boolean);
}

function extractExports(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const exports = [];
  for (const match of text.matchAll(/export\s+(?:type\s+|interface\s+|function\s+|const\s+|class\s+|enum\s+)([A-Za-z_$][\w$]*)/gu)) {
    exports.push(match[1]);
  }
  for (const match of text.matchAll(/export\s+type\s*\{([^}]+)\}/gu)) {
    exports.push(...splitExportBlock(match[1]));
  }
  for (const match of text.matchAll(/export\s*\{([^}]+)\}/gu)) {
    exports.push(...splitExportBlock(match[1]));
  }
  return [...new Set(exports)].sort();
}

function extractSchemaIds(files) {
  const ids = new Set();
  for (const file of files) {
    if (![".ts", ".tsx", ".js", ".mjs", ".rs", ".json"].includes(path.extname(file))) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/["']((?:tenra|guardrail)[A-Za-z0-9_.:-]+\.v1)["']/gu)) {
      ids.add(match[1]);
    }
    for (const match of text.matchAll(/@tenra-handoff\s+([A-Za-z0-9_.:-]+\.v1)/gu)) {
      ids.add(match[1]);
    }
  }
  return [...ids].sort();
}

function extractStringConstants(files, pattern) {
  const values = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(pattern)) values.add(match[1]);
  }
  return [...values].sort();
}

function workspacePackages() {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => walkAll(path.join(root, entry.name)))
    .filter((file) => path.basename(file) === "package.json" && !relative(file).includes("node_modules/"))
    .map((file) => {
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      return {
        path: relative(file),
        name: json.name,
        exports: json.exports ?? null
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function actualContracts(files) {
  const allFiles = walkAll(root);
  const rootPackage = readJson("package.json", {});
  const tauriFiles = allFiles.filter((file) => relative(file).includes("src-tauri/src/") && file.endsWith(".rs"));
  return {
    packageName: rootPackage.name,
    packageScripts: Object.keys(rootPackage.scripts ?? {}).sort(),
    workspacePackages: workspacePackages(),
    packageExports: Object.fromEntries(
      files
        .filter((file) => /(^|\/)packages\/[^/]+\/src\/index\.ts$/.test(relative(file)))
        .map((file) => [relative(file), extractExports(file)])
        .sort(([a], [b]) => a.localeCompare(b))
    ),
    schemaIds: extractSchemaIds(allFiles),
    storageKeys: extractStringConstants(files, /(?:StorageKey|storageKey)\s*=\s*["']([^"']+)["']/gu),
    tauriCommands: extractStringConstants(tauriFiles, /#\[tauri::command\]\s*(?:pub\s+)?fn\s+([A-Za-z0-9_]+)/gu),
    tauriMenuIds: extractStringConstants(tauriFiles, /const\s+MENU_[A-Z_]+:\s*&str\s*=\s*"([^"]+)"/gu),
    uiSectionIds: extractStringConstants(files, /\bid[:=]\s*["']([A-Za-z0-9_-]+)["']/gu)
  };
}

function compareContracts(actual) {
  const snapshotPath = config.contractSnapshotPath ? path.join(root, config.contractSnapshotPath) : "";
  if (!snapshotPath || !fs.existsSync(snapshotPath)) return ["contract snapshot is missing."];
  const expected = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  return JSON.stringify(actual, null, 2) === JSON.stringify(expected, null, 2)
    ? []
    : ["contract snapshot drifted. Update the snapshot only with matching compatibility tests."];
}

const sourceRoots = (config.sourceRoots ?? ["apps", "packages", "scripts"]).filter((dir) =>
  fs.existsSync(path.join(root, dir))
);
const files = sourceRoots.flatMap((directory) => walk(path.join(root, directory))).filter((file, index, all) => all.indexOf(file) === index);
const records = files.map((file) => ({ file: relative(file), ext: path.extname(file), lines: lineCount(file) }));
const implementationRecords = records.filter((record) => !styleExtensions.has(record.ext));
const styleRecords = records.filter((record) => styleExtensions.has(record.ext));
const generatedRecords = records.filter((record) => generatedPatterns.some((pattern) => matchesPattern(record.file, pattern)) && !allowedGenerated.has(record.file));
const violations = [];

for (const record of records) {
  const budget = budgetFor(record);
  if (record.lines > budget) violations.push(`${record.file} has ${record.lines} lines; budget is ${budget}.`);
  if (strict && record.lines > budget - nearLineMargin) {
    violations.push(`${record.file} is within ${nearLineMargin} lines of its ${budget}-line budget.`);
  }
}

for (const record of implementationRecords) {
  const text = fs.readFileSync(path.join(root, record.file), "utf8");
  if (/from\s+["'][^"']*(?:dist|build|target|node_modules)\//u.test(text)) {
    violations.push(`${record.file} imports from generated, build, or dependency output.`);
  }
}

for (const [file, patterns] of Object.entries(config.bannedStartupImports ?? {})) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const text = fs.readFileSync(absolute, "utf8");
  for (const pattern of patterns) {
    if (new RegExp(pattern).test(text)) violations.push(`${file} imports startup-banned pattern ${pattern}.`);
  }
}

for (const file of config.cssEntryFiles ?? []) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const nonImportLines = fs
    .readFileSync(absolute, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim() && !line.trim().startsWith("@import") && !line.trim().startsWith("/*"));
  if (nonImportLines.length > 0) violations.push(`${file} should remain an import-only style entry.`);
}

if (generatedRecords.length > 0 && config.allowGeneratedArtifacts !== true) {
  violations.push("generated/runtime artifacts in source scan: " + generatedRecords.slice(0, 12).map((record) => record.file).join(", "));
}

for (const asset of config.assetBudgets ?? []) {
  const absolute = path.join(root, asset.path);
  if (!fs.existsSync(absolute)) {
    violations.push(`${asset.path} is missing.`);
    continue;
  }
  const size = fs.statSync(absolute).size;
  if (size > asset.maxBytes) violations.push(`${asset.path} is ${size} bytes; budget is ${asset.maxBytes}.`);
  if (strict && size > asset.maxBytes - nearAssetMarginBytes) {
    violations.push(`${asset.path} is within ${nearAssetMarginBytes} bytes of its asset budget.`);
  }
}

const contracts = actualContracts(files);
if (writeContracts) {
  const snapshotPath = config.contractSnapshotPath ? path.join(root, config.contractSnapshotPath) : "";
  if (!snapshotPath) {
    console.error("contractSnapshotPath is not configured.");
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(contracts, null, 2) + "\n");
  console.log(`Wrote ${path.relative(root, snapshotPath)}`);
  process.exit(0);
}
violations.push(...compareContracts(contracts));

console.log((config.label ?? path.basename(root)) + " maintainability audit");
console.log("");
console.log("Largest implementation files:");
for (const record of implementationRecords.sort((a, b) => b.lines - a.lines).slice(0, 14)) {
  console.log("- " + record.file + ": " + record.lines + " lines");
}
console.log("");
console.log("Largest style files:");
for (const record of styleRecords.sort((a, b) => b.lines - a.lines).slice(0, 10)) {
  console.log("- " + record.file + ": " + record.lines + " lines");
}
console.log("");
console.log("Generated/runtime findings: " + generatedRecords.length);
console.log("Contract snapshot: checked");

if (violations.length > 0) {
  console.log("");
  console.log("Maintainability findings:");
  for (const violation of violations) console.log("- " + violation);
  if (strict) process.exit(1);
}
