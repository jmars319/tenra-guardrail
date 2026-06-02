#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

section "Starting tenra Guardrail mobile reserved surface"
cd "$REPO_ROOT"
run pnpm --filter @guardrail/mobileapp dev
