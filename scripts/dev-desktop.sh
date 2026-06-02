#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

section "Starting Guardrail by Tenra desktop app"
cd "$REPO_ROOT"
run pnpm --filter @guardrail/desktopapp dev
