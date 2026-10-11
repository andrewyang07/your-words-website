#!/usr/bin/env bash
# One-shot proof (add --perf for the Lighthouse/JS budget gate, adds ~5–12 min: 3 Lighthouse runs x 4 routes): launch → doctor → HTTP checks → browser flows → cleanup. Evidence survives in .verify/evidence/<stamp>.
set -uo pipefail
DIR="$(dirname "$0")"
export VERIFY_EVIDENCE="${VERIFY_EVIDENCE:-${VERIFY_REPO:-$(cd "$DIR/../../../.." && pwd)}/.verify/evidence/$(date +%Y%m%d-%H%M%S)}"
source "$DIR/env.sh"
trap '"$DIR/cleanup.sh"' EXIT
PERF=0; ARGS=(); for a in "$@"; do [[ $a == --perf ]] && PERF=1 || ARGS+=("$a"); done; set -- "${ARGS[@]}"
"$DIR/ensure-tools.sh" || exit 1
"$DIR/launch.sh" "$@" || exit 1
"$DIR/doctor.sh" || exit 1
"$DIR/check-http.sh"; http=$?
"$DIR/drive.sh"; browser=$?
perf=0; [[ $PERF == 1 ]] && { "$DIR/check-perf.sh"; perf=$?; }
ln -sfn "$VERIFY_EVIDENCE" "$VERIFY_STATE/evidence/latest-run"
if [[ $http == 0 && $browser == 0 && $perf == 0 ]]; then echo "VERIFY PASS  evidence: $VERIFY_EVIDENCE"; else echo "VERIFY FAIL  evidence: $VERIFY_EVIDENCE"; exit 1; fi
