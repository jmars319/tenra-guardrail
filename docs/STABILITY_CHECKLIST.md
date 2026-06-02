# Stability Checklist

Run this checklist before tagging or cutting a milestone:

- `pnpm install` completes successfully.
- `pnpm check:env` confirms the local desktop toolchain is present.
- `pnpm check:packages` confirms workspace manifests exist and `pnpm` resolves them.
- `pnpm lint` passes across apps and packages.
- `pnpm typecheck` passes across apps and packages.
- `pnpm verify:web` passes and the web review surface builds.
- `pnpm verify:desktop` passes, the desktop UI builds, and the Rust/Tauri crate passes `cargo check`.
- `pnpm verify:mobile` passes and the reserved mobile surface remains structurally valid.
- Shared imports resolve from apps into `@guardrail/*` packages without manual path hacks.
- README and docs still describe the actual workspace layout.
- The desktop app remains the primary active surface, the web review surface stays secondary, and mobile remains clearly reserved unless intentionally promoted.
- Tool Host policy defaults remain deterministic, deny-by-default, and network-disabled by default.
