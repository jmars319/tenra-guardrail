#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

section "Verifying web review surface"
cd "$REPO_ROOT"
run pnpm --filter @guardrail/webapp lint
run pnpm --filter @guardrail/webapp typecheck
run pnpm --filter @guardrail/webapp build
