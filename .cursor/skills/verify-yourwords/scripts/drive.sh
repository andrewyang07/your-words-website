#!/usr/bin/env bash
# Headless browser flows (Playwright/Chromium) with screenshots. Usage: drive.sh [flow ...]  (default: all)
set -euo pipefail
source "$(dirname "$0")/env.sh"
if [[ ! -d "$VERIFY_TOOLS/node_modules/playwright-core" ]]; then
  (cd "$VERIFY_TOOLS" && { [[ -f package.json ]] || npm init -y >/dev/null; } && npm i playwright-core@1.64.0 --no-audit --no-fund >/dev/null)
fi
# Chromium binary: playwright cache (revision 1248 for 1.64) or install it once.
NODE_PATH="$VERIFY_TOOLS/node_modules" node -e "require('playwright-core').chromium.executablePath()" >/dev/null 2>&1 \
  && [[ -d "$HOME/.cache/ms-playwright" ]] || (cd "$VERIFY_TOOLS" && npx playwright-core install chromium)
export VERIFY_BASE VERIFY_EVIDENCE REPO_ROOT
NODE_PATH="$VERIFY_TOOLS/node_modules" node "$(dirname "$0")/drive.mjs" "$@"
