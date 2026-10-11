#!/usr/bin/env bash
# Perf budget gate against the running local prod build. Usage: check-perf.sh [--measure]
# Needs launch.sh to have started a PROD build (not --dev). Budgets: ../perf-budgets.json.
set -uo pipefail
DIR="$(dirname "$0")"
source "$DIR/env.sh"
export CHROME_PATH="${CHROME_PATH:-$(ls "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux*/chrome 2>/dev/null | sort | tail -1)}"
[[ -x "$CHROME_PATH" ]] || { echo "FAIL perf: no Chromium found (set CHROME_PATH)"; exit 1; }
node "$DIR/check-perf.mjs" "$VERIFY_BASE" "${VERIFY_PERF_BUDGETS:-$DIR/../perf-budgets.json}" "$VERIFY_EVIDENCE" "$@"
