#!/usr/bin/env bash
# One-shot proof: launch → doctor → HTTP checks → browser flows → cleanup. Evidence survives in .verify/evidence/<stamp>.
set -uo pipefail
DIR="$(dirname "$0")"
export VERIFY_EVIDENCE="${VERIFY_EVIDENCE:-${VERIFY_REPO:-$(cd "$DIR/../../../.." && pwd)}/.verify/evidence/$(date +%Y%m%d-%H%M%S)}"
source "$DIR/env.sh"
trap '"$DIR/cleanup.sh"' EXIT
"$DIR/launch.sh" "$@" || exit 1
"$DIR/doctor.sh" || exit 1
"$DIR/check-http.sh"; http=$?
"$DIR/drive.sh"; browser=$?
ln -sfn "$VERIFY_EVIDENCE" "$VERIFY_STATE/evidence/latest-run"
if [[ $http == 0 && $browser == 0 ]]; then echo "VERIFY PASS  evidence: $VERIFY_EVIDENCE"; else echo "VERIFY FAIL  evidence: $VERIFY_EVIDENCE"; exit 1; fi
