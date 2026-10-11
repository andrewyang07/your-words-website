#!/usr/bin/env bash
# HTTP assertions against a running instance. Prints PASS/FAIL/SKIP per check, exits 1 on any FAIL.
set -uo pipefail
source "$(dirname "$0")/env.sh"
cd "$REPO_ROOT"
OUT="$VERIFY_EVIDENCE/http"; mkdir -p "$OUT"
pass=0; fail=0; skip=0
PASS() { echo "PASS $1"; pass=$((pass+1)); }
FAIL() { echo "FAIL $1"; fail=$((fail+1)); }
SKIP() { echo "SKIP $1"; skip=$((skip+1)); }
check() { # name expr
  if eval "$2"; then PASS "$1"; else FAIL "$1"; fi
}
get() { # slug path -> writes body + headers, echoes status
  curl -s -D "$OUT/$1.headers" -o "$OUT/$1.body" -w '%{http_code}' "$VERIFY_BASE$2"
}
has_share_link() { [[ -f lib/reciteLink.ts ]]; }

for route in / /search /discover /rankings /note /help /about /memorize /sitemap.xml; do
  slug=$(echo "route$route" | tr '/.' '__')
  code=$(get "$slug" "$route"); check "GET $route -> 200" "[[ $code == 200 ]]"
done
code=$(get not_found /definitely-not-a-page); check "GET unknown route -> 404" "[[ $code == 404 ]]"

code=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$VERIFY_BASE/review?p=43-3-16&sv=1")
echo "$code" > "$OUT/review_redirect.txt"
check "/review?p=… redirects to /memorize keeping query" "[[ '$code' == 30[78]' '*'/memorize?p=43-3-16&sv=1' ]]"

get memorize_plain /memorize >/dev/null
check "/memorize (no params) keeps static metadata (no /api/og image)" "! grep -q 'api/og/memorize' $OUT/memorize_plain.body"

if has_share_link; then
  get memorize_p '/memorize?p=43-3-16~18&t=test&sv=1' >/dev/null
  check "/memorize?p= og:image -> /api/og/memorize" "grep -q 'property=\"og:image\" content=\"[^\"]*/api/og/memorize?p=43-3-16~18&amp;t=test' $OUT/memorize_p.body"
  check "/memorize?p= twitter:card summary_large_image" "grep -q 'summary_large_image' $OUT/memorize_p.body"
  check "/memorize?p= og:title = t" "grep -q 'property=\"og:title\" content=\"test\"' $OUT/memorize_p.body"
  get memorize_s '/memorize?s=19-23-1,43-3-16' >/dev/null
  check "/memorize?s= gets dynamic og:image" "grep -q 'api/og/memorize?p=19-23-1,43-3-16' $OUT/memorize_s.body"
  get memorize_bad '/memorize?p=abc' >/dev/null
  check "/memorize?p=<invalid> falls back to static metadata" "! grep -q 'api/og/memorize' $OUT/memorize_bad.body"

  for case in "og_valid|/api/og/memorize?p=43-3-16~18&t=%E8%AF%97%E7%AF%8723" "og_invalid|/api/og/memorize?p=abc" "og_empty|/api/og/memorize"; do
    slug=${case%%|*}; path=${case#*|}
    curl -s -D "$OUT/$slug.headers" -o "$OUT/$slug.png" -w '%{http_code}' "$VERIFY_BASE$path" > "$OUT/$slug.status"
    code=$(cat "$OUT/$slug.status")
    check "$path -> 200" "[[ $code == 200 ]]"
    check "$path content-type image/png" "grep -qi '^content-type: image/png' $OUT/$slug.headers"
    dims=$(python3 -c "import struct,sys;d=open(sys.argv[1],'rb').read(24);print('%dx%d'%struct.unpack('>II',d[16:24]) if d[:8]==b'\x89PNG\r\n\x1a\n' else 'not-png')" "$OUT/$slug.png")
    check "$path is 1200x630 PNG ($dims)" "[[ $dims == 1200x630 ]]"
  done
  check "OG Cache-Control immutable" "grep -qi '^cache-control: public, max-age=86400, s-maxage=604800, immutable' $OUT/og_valid.headers"
else
  SKIP "share-link (背诵链接) checks — lib/reciteLink.ts not in this checkout"
fi

echo "HTTP SUMMARY pass=$pass fail=$fail skip=$skip  (artifacts: $OUT)"
[[ $fail == 0 ]]
