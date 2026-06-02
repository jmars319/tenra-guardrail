#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

section "Verifying mobile reserved surface"
cd "$REPO_ROOT"
run pnpm --filter @guardrail/mobileapp lint
run pnpm --filter @guardrail/mobileapp typecheck
run pnpm --filter @guardrail/mobileapp build
