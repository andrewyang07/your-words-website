#!/usr/bin/env bash
# Read-only: is the instance on $VERIFY_PORT ours, up, and serving the current checkout?
set -uo pipefail
source "$(dirname "$0")/env.sh"
cd "$REPO_ROOT"
ok=1
if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then echo "ok   process pid $(cat "$PIDFILE") alive"; else echo "FAIL no live server started by launch.sh on port $VERIFY_PORT"; ok=0; fi
code=$(curl -s -o /dev/null -w '%{http_code}' "$VERIFY_BASE/" || true)
[[ "$code" == 200 ]] && echo "ok   GET / -> 200" || { echo "FAIL GET / -> $code"; ok=0; }
started=$(cat "$VERIFY_STATE/server-${VERIFY_PORT}.commit" 2>/dev/null || echo none)
head=$(git rev-parse HEAD)
[[ "$started" == "$head" ]] && echo "ok   server built from HEAD ${head:0:7} ($(git branch --show-current))" || { echo "WARN server started at ${started:0:7}, HEAD is ${head:0:7} — relaunch with --rebuild"; }
[[ -z "$(git status --porcelain -- app components lib stores public)" ]] || echo "WARN uncommitted source changes — prod build may be stale (launch.sh --rebuild)"
[[ -f .next/BUILD_ID ]] && echo "ok   .next/BUILD_ID $(cat .next/BUILD_ID)"
[[ -d "$VERIFY_TOOLS/node_modules/playwright-core" ]] && echo "ok   playwright-core in $VERIFY_TOOLS" || echo "WARN playwright-core missing — ensure-tools.sh will install it"
[[ $ok == 1 ]] && echo "DOCTOR OK" || { echo "DOCTOR FAIL"; exit 1; }
