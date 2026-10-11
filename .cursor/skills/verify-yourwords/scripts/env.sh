#!/usr/bin/env bash
# Shared settings for the verify-yourwords helpers. Source, don't execute.
REPO_ROOT="${VERIFY_REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)}"
VERIFY_PORT="${VERIFY_PORT:-3460}"
VERIFY_BASE="${VERIFY_BASE:-http://localhost:${VERIFY_PORT}}"
VERIFY_STATE="${VERIFY_STATE:-$REPO_ROOT/.verify}"            # scratch state (pid, logs); gitignored
VERIFY_EVIDENCE="${VERIFY_EVIDENCE:-$VERIFY_STATE/evidence/latest}" # proof artifacts; survive cleanup
VERIFY_TOOLS="${VERIFY_TOOLS:-$HOME/.cache/verify-yourwords}"  # playwright-core lives here, not in package.json
PIDFILE="$VERIFY_STATE/server-${VERIFY_PORT}.pid"
LOGFILE="$VERIFY_STATE/server-${VERIFY_PORT}.log"
mkdir -p "$VERIFY_STATE" "$VERIFY_EVIDENCE"
