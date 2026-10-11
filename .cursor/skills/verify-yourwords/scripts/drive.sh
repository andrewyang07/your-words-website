#!/usr/bin/env bash
# Headless browser flows (Playwright/Chromium) with screenshots. Usage: drive.sh [flow ...]  (default: all)
set -euo pipefail
source "$(dirname "$0")/env.sh"
"$(dirname "$0")/ensure-tools.sh" >/dev/null
export VERIFY_BASE VERIFY_EVIDENCE REPO_ROOT
NODE_PATH="$VERIFY_TOOLS/node_modules" node "$(dirname "$0")/drive.mjs" "$@"
