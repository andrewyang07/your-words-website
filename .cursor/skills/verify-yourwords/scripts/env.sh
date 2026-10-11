#!/usr/bin/env bash
# Shared settings for the verify-yourwords helpers. Source, don't execute.
REPO_ROOT="${VERIFY_REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)}"
VERIFY_PORT="${VERIFY_PORT:-3460}"
VERIFY_BASE="${VERIFY_BASE:-http://localhost:${VERIFY_PORT}}"
VERIFY_STATE="${VERIFY_STATE:-$REPO_ROOT/.verify}"            # scratch state (pid, logs); gitignored
VERIFY_EVIDENCE="${VERIFY_EVIDENCE:-$VERIFY_STATE/evidence/latest}" # proof artifacts; survive cleanup
VERIFY_TOOLS="${VERIFY_TOOLS:-/workspace/.cache/verify-yourwords}"  # playwright-core, lighthouse, chromium; persistent, not in package.json
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$VERIFY_TOOLS/ms-playwright}"
PIDFILE="$VERIFY_STATE/server-${VERIFY_PORT}.pid"
LOGFILE="$VERIFY_STATE/server-${VERIFY_PORT}.log"
mkdir -p "$VERIFY_STATE" "$VERIFY_EVIDENCE"
