import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const appJsonPath = path.join(root, "app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

if (appJson.guardrail?.status !== "placeholder") {
  console.error("mobile app must remain a placeholder in v0");
  process.exit(1);
}

if (appJson.guardrail?.primarySurface !== "desktopapp") {
  console.error("desktopapp must remain the primary surface in v0");
  process.exit(1);
}

console.log("mobile reserved-surface metadata is structurally valid");
