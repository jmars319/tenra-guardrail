#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

section "Starting Guardrail by Tenra web review surface"
cd "$REPO_ROOT"
run pnpm --filter @guardrail/webapp dev
