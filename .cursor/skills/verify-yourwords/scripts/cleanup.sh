#!/usr/bin/env bash
# Stop only the server launch.sh started (by pidfile / process group). Evidence is kept.
set -uo pipefail
source "$(dirname "$0")/env.sh"
if [[ -f "$PIDFILE" ]]; then
  pid=$(cat "$PIDFILE")
  if kill -0 "$pid" 2>/dev/null; then
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid"
    for _ in $(seq 1 10); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
    kill -0 "$pid" 2>/dev/null && kill -KILL -- "-$pid" 2>/dev/null
    echo "stopped pid $pid"
  fi
  [[ -f "$LOGFILE" ]] && cp "$LOGFILE" "$VERIFY_EVIDENCE/server.log"
  rm -f "$PIDFILE" "$LOGFILE" "$VERIFY_STATE/server-${VERIFY_PORT}.commit"
else
  echo "nothing to stop on port $VERIFY_PORT"
fi
echo "evidence kept in $VERIFY_EVIDENCE"
