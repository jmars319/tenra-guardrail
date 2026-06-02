# Guardrail by Tenra

Guardrail by Tenra is a local-first desktop application for running AI agents inside explicit runtime boundaries. The desktop shell wraps a Rust service and routes agent actions through a Tool Host boundary instead of letting models execute tools directly.

The project is not a generic SaaS starter. Its center of gravity is policy enforcement, approvals, auditability, provider configuration, and local runtime control.

## Operational Purpose

- Define a deny-by-default Tool Host boundary for agent actions.
- Keep policy enforcement deterministic and inspectable.
- Separate UI, runtime service, provider configuration, and policy contracts.
- Provide local diagnostics and exportable snapshots for audit review.

## Design Posture

- Agents never execute tools directly.
- Network-capable tooling is disabled by default in v0.
- Desktop-first because local filesystem, process, approval, and secrets boundaries live on the machine.
- The web channel supports secondary external review visibility; mobile remains reserved until it can support the runtime model.
- Policy and runtime contracts are shared packages, not UI-only conventions.

## Architecture

```text
apps/
  desktopapp/   Primary Tauri + React product surface
  webapp/       Secondary external review surface
  mobileapp/    Reserved mobile surface

packages/
  runtime-contracts/ Tool Host and runtime service contracts
  policy/            Deny-by-default policy helpers
  provider-config/   Provider catalog and defaults
  secrets/           Secret-detection descriptors and redaction helpers
  privacy/           Privacy defaults and audit redaction rules
  api-contracts/     UI-to-runtime command and event contracts
  domain/            Product models and seeded records
  validation/        Runtime validation helpers
  ui/                Shared navigation and product copy
```

## Current State

- The desktop app is the only active product surface.
- The web app is a secondary external review surface; mobile remains reserved for future activation.
- Runtime, policy, provider, privacy, and validation packages define the v0 spine.
- The local runtime diagnostics and JSON snapshot export support review work.

## Deployment Posture

Guardrail is a local desktop safety product. It should not be positioned as a complete agent-safety platform until Tool Host enforcement, approval UX, audit storage, provider handling, and OS-level boundaries have been validated.

## Working Locally

```bash
pnpm run bootstrap
pnpm run dev:desktop
pnpm run launch:desktop
pnpm run verify:all
pnpm run doctor
```

## Direction

- Harden the Tool Host boundary and runtime command model.
- Add approvals and audit persistence before expanding tool coverage.
- Keep provider configuration explicit and local-first.
- Activate web or mobile surfaces only when they support the runtime model.

## Related Documentation

- [Local Service Boundary](docs/LOCAL_SERVICE_BOUNDARY.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Repo Map](docs/REPO_MAP.md)
- [Stability Checklist](docs/STABILITY_CHECKLIST.md)
