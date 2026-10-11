#!/usr/bin/env bash
# Perf budget gate against the running local prod build. Usage: check-perf.sh [--measure]
# Needs launch.sh to have started a PROD build (not --dev). Budgets: ../perf-budgets.json.
set -uo pipefail
DIR="$(dirname "$0")"
source "$DIR/env.sh"
"$DIR/ensure-tools.sh" >/dev/null || exit 1
export CHROME_PATH="${CHROME_PATH:-$(node -e "process.stdout.write(require('$VERIFY_TOOLS/node_modules/playwright-core').chromium.executablePath())")}"
export PATH="$VERIFY_TOOLS/node_modules/.bin:$PATH"  # local lighthouse
[[ -x "$CHROME_PATH" ]] || { echo "FAIL perf: no Chromium found (set CHROME_PATH)"; exit 1; }
node "$DIR/check-perf.mjs" "$VERIFY_BASE" "${VERIFY_PERF_BUDGETS:-$DIR/../perf-budgets.json}" "$VERIFY_EVIDENCE" "$@"
