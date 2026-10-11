#!/usr/bin/env bash
# Idempotent: make sure playwright-core, its Chromium and lighthouse exist under $VERIFY_TOOLS.
# Paths are absolute: a stray parent node_modules (e.g. a global pnpm store) must not shadow our playwright-core.
# Cheap no-op when present; reinstalls after a box restart wipes caches. Never touches package.json.
set -euo pipefail
source "$(dirname "$0")/env.sh"
PW_VER=1.64.0; LH_VER=12
mkdir -p "$VERIFY_TOOLS" "$PLAYWRIGHT_BROWSERS_PATH"
cd "$VERIFY_TOOLS"
[[ -f package.json ]] || npm init -y >/dev/null
need=()
[[ -f node_modules/playwright-core/package.json ]] || need+=("playwright-core@$PW_VER")
[[ -x node_modules/.bin/lighthouse ]] || need+=("lighthouse@$LH_VER")
if ((${#need[@]})); then
  echo "tools: installing ${need[*]} into $VERIFY_TOOLS"
  npm i "${need[@]}" --no-audit --no-fund --loglevel=error >/dev/null
fi
chrome=$(node -e "process.stdout.write(require('$VERIFY_TOOLS/node_modules/playwright-core').chromium.executablePath())")
if [[ ! -x "$chrome" ]]; then
  echo "tools: installing Chromium into $PLAYWRIGHT_BROWSERS_PATH"
  node node_modules/playwright-core/cli.js install chromium >/dev/null
fi
[[ -x "$chrome" ]] || { echo "FAIL tools: Chromium missing after install ($chrome)"; exit 1; }
echo "ok   tools in $VERIFY_TOOLS (playwright-core $PW_VER, lighthouse $LH_VER, chromium)"
