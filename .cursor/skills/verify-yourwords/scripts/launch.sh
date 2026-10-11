#!/usr/bin/env bash
# Start the production build on $VERIFY_PORT (default 3460). Usage: launch.sh [--rebuild] [--dev]
set -euo pipefail
source "$(dirname "$0")/env.sh"
cd "$REPO_ROOT"
REBUILD=0; MODE=prod
for arg in "$@"; do case "$arg" in --rebuild) REBUILD=1;; --dev) MODE=dev;; esac; done

if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "already running (pid $(cat "$PIDFILE")) on $VERIFY_BASE — run cleanup.sh first or use another VERIFY_PORT"; exit 1
fi
if ss -ltn "sport = :$VERIFY_PORT" | grep -q LISTEN; then
  echo "FAIL port $VERIFY_PORT is in use by a process we did not start; pick another VERIFY_PORT"; exit 1
fi
[[ -d node_modules ]] || npm ci --no-audit --no-fund
if [[ "$MODE" == prod ]]; then
  # The build is stamped with the commit it came from; reuse it only if that matches a clean HEAD.
  STAMP=.next/verify-build-commit
  HEAD_SHA=$(git rev-parse HEAD)
  # Source dirt that affects the build (skill files, tests and docs don't).
  DIRTY=$(git status --porcelain -- . ':!.cursor' ':!tests' ':!docs' ':!*.md' ':!.verify' | head -5)
  BUILT=$(cat "$STAMP" 2>/dev/null || echo none)
  if [[ $REBUILD == 0 && -f .next/BUILD_ID ]]; then
    if [[ -n "$DIRTY" ]]; then echo "INFO working tree has uncommitted source changes — rebuilding"; REBUILD=1
    elif [[ "$BUILT" != "$HEAD_SHA" ]]; then echo "INFO existing build is from ${BUILT:0:12}, HEAD is ${HEAD_SHA:0:12} — rebuilding"; REBUILD=1
    fi
  fi
  if [[ $REBUILD == 1 || ! -f .next/BUILD_ID ]]; then
    rm -f "$STAMP"; echo "building (npm run build)…"; npm run build > "$VERIFY_STATE/build.log" 2>&1 || { echo "FAIL build — see $VERIFY_STATE/build.log"; exit 1; }
    if [[ -n "$DIRTY" ]]; then echo "${HEAD_SHA}-dirty" > "$STAMP"; else echo "$HEAD_SHA" > "$STAMP"; fi
  fi
  BUILT=$(cat "$STAMP")
  echo "TESTING build of $BUILT ($(git log -1 --format=%s "$HEAD_SHA" | cut -c1-60))"
  setsid npx next start -p "$VERIFY_PORT" > "$LOGFILE" 2>&1 < /dev/null &
else
  setsid npx next dev -p "$VERIFY_PORT" > "$LOGFILE" 2>&1 < /dev/null &
fi
echo $! > "$PIDFILE"
if [[ "$MODE" == prod ]]; then echo "$BUILT" > "$VERIFY_STATE/server-${VERIFY_PORT}.commit"
else git rev-parse HEAD > "$VERIFY_STATE/server-${VERIFY_PORT}.commit"; fi
for _ in $(seq 1 90); do
  if curl -fs -o /dev/null "$VERIFY_BASE/"; then echo "READY $VERIFY_BASE (pid $(cat "$PIDFILE"), mode $MODE)"; exit 0; fi
  kill -0 "$(cat "$PIDFILE")" 2>/dev/null || { echo "FAIL server exited — see $LOGFILE"; exit 1; }
  sleep 1
done
echo "FAIL not ready after 90s — see $LOGFILE"; exit 1
