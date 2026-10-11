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
  if [[ $REBUILD == 1 || ! -f .next/BUILD_ID ]]; then
    echo "building (npm run build)…"; npm run build > "$VERIFY_STATE/build.log" 2>&1 || { echo "FAIL build — see $VERIFY_STATE/build.log"; exit 1; }
  fi
  setsid npx next start -p "$VERIFY_PORT" > "$LOGFILE" 2>&1 < /dev/null &
else
  setsid npx next dev -p "$VERIFY_PORT" > "$LOGFILE" 2>&1 < /dev/null &
fi
echo $! > "$PIDFILE"
git rev-parse HEAD > "$VERIFY_STATE/server-${VERIFY_PORT}.commit"
for _ in $(seq 1 90); do
  if curl -fs -o /dev/null "$VERIFY_BASE/"; then echo "READY $VERIFY_BASE (pid $(cat "$PIDFILE"), mode $MODE)"; exit 0; fi
  kill -0 "$(cat "$PIDFILE")" 2>/dev/null || { echo "FAIL server exited — see $LOGFILE"; exit 1; }
  sleep 1
done
echo "FAIL not ready after 90s — see $LOGFILE"; exit 1
