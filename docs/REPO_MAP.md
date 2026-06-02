# Repo Map

## Top level

- `apps/`: product surfaces. Only the desktop app is active in v0.
- `packages/`: shared TypeScript contracts and defaults.
- `scripts/`: root automation for bootstrap, verification, and health.
- `docs/`: repo documentation.
- `archive/`: reserved for deferred experiments and retired artifacts.

## Apps

- `apps/desktopapp`: primary Tauri application. The React UI presents local state while the Rust layer owns runtime orchestration, Tool Host routing, policy checks, approvals, audit, providers, and secret-detection boundaries.
- `apps/desktopapp/src`: desktop UI entrypoints and layout.
- `apps/desktopapp/src-tauri`: Rust application crate and Tauri configuration.
- `apps/webapp`: secondary external review surface that explicitly states desktop-first product focus.
- `apps/mobileapp`: reserved mobile surface with structural validation only.

## Packages

- `packages/shared-types`: shared primitive type helpers and branded identifiers.
- `packages/domain`: domain entities for providers, projects, profiles, sessions, and approvals.
- `packages/api-contracts`: UI-facing commands and events for talking to the runtime boundary.
- `packages/runtime-contracts`: Tool Host request, policy snapshot, and runtime overview contracts.
- `packages/policy`: deterministic deny-by-default policy definitions and evaluator.
- `packages/provider-config`: provider catalog metadata with disabled-by-default network posture.
- `packages/privacy`: privacy defaults and audit redaction policy descriptors.
- `packages/secrets`: secret pattern descriptors and redaction helper.
- `packages/validation`: small validation helpers for config and policy objects.
- `packages/ui`: shared desktop navigation metadata and product copy.
- `packages/config`: runtime defaults such as ports, product metadata, and derived policy defaults.

## Root scripts

- `scripts/bootstrap.sh`: checks the environment, installs dependencies, and validates workspace manifests.
- `scripts/check-env.sh`: validates required toolchain components.
- `scripts/check-packages.sh`: validates workspace manifests and pnpm workspace resolution.
- `scripts/dev-*.sh`: run surface-specific development entrypoints.
- `scripts/verify-*.sh`: run lint, typecheck, and build checks for each app surface.
- `scripts/verify-all.sh`: full repository verification.
- `scripts/doctor.sh`: fast health summary without full builds.

## Notes

- Guardrail’s runtime boundary is intentionally visible in naming.
- Desktop UI code and runtime code remain separate directories.
- Placeholder surfaces are present for future activation, not current product parity.
