# Developer Guide

## Bootstrap flow

1. Run `pnpm bootstrap`.
2. Review `pnpm check:env` output for missing local prerequisites.
3. Use `pnpm doctor` for a fast lint and typecheck pass.
4. Use `pnpm verify:all` before committing scaffold-level changes.

## Running apps

- Desktop: `pnpm dev:desktop`
- Web placeholder: `pnpm dev:web`
- Mobile placeholder: `pnpm dev:mobile`
- Desktop + web together: `pnpm dev:both`

`apps/desktopapp` is the only fully active product surface. The web and mobile apps exist so future work has stable directories, package names, and verification hooks.

## System health and verification

- `pnpm check:env`: validates Node, pnpm, git, Rust, Cargo, and basic platform desktop prerequisites.
- `pnpm check:packages`: validates workspace manifests and `pnpm` package graph resolution.
- `pnpm lint`: lints every workspace.
- `pnpm typecheck`: typechecks every workspace.
- `pnpm verify:web`: lints, typechecks, and builds the web placeholder.
- `pnpm verify:desktop`: lints, typechecks, builds the desktop UI, and runs `cargo check` for the Rust crate.
- `pnpm verify:mobile`: validates the mobile placeholder without pretending it is an active product surface.
- `pnpm doctor`: fast combined health check.

## Local Tooling

The shared local machine baseline supports Guardrail's security-sensitive desktop workflow:

- Use `cargo audit`, `cargo deny`, and `sccache` around Tauri/Rust work in `apps/desktopapp/src-tauri`.
- Use `actionlint` before changing GitHub Actions workflows.
- Use `shellcheck` and `shfmt` when editing repo scripts.
- Use `osv-scanner` for dependency advisory checks across package manifests.
- Use `pa11y` and `lighthouse` against the running web or desktop-served UI when policy-review screens change.

## Adding packages

1. Create a new folder under `packages/`.
2. Add a `package.json`, `tsconfig.json`, and `src/index.ts`.
3. Use the `@guardrail/*` naming convention.
4. Keep the package narrow and explicit.
5. Update docs when the new package changes the architecture meaningfully.

Prefer packages that map to real Guardrail concerns such as policy, runtime contracts, privacy, provider configuration, approvals, or secrets. Avoid generic placeholders that add structure without purpose.

## Adding apps

1. Create a folder under `apps/`.
2. Add the app manifest and its own `typecheck`, `lint`, and `build` scripts.
3. Add a root `dev:*` or `verify:*` script only if the surface is meaningfully active.
4. Update `docs/REPO_MAP.md` and `README.md`.

If a new surface becomes active, be explicit about why it no longer counts as a placeholder.

## Desktop-first and local-first expectations

Guardrail’s initial architecture should continue to optimize for:

- a local desktop shell,
- a Rust-backed runtime,
- deterministic Tool Host policy enforcement,
- approval and audit visibility,
- disabled-by-default network-capable agent tooling.

Future web or mobile work should not erode the rule that agents do not execute tools directly. Any new surface must still route actions through the same runtime and Tool Host boundaries.
