# OG previews

## Sub-features
- `/memorize?p|s=…` → `generateMetadata`: og:title = `t` or "<首节>等 N 节", description = first 60 chars, og:image/twitter:image `/api/og/memorize?p=<canonical>&t=…`, `twitter:card=summary_large_image`. Invalid/no params → static metadata.
- `/api/og/memorize` → 1200×630 PNG (Node runtime, font `public/fonts/NotoSerifSC-og-subset.otf`), generic brand image for invalid input, `Cache-Control: public, max-age=86400, s-maxage=604800, immutable`.

## How to get to it (user POV)
Paste a 背诵链接 into iMessage/Telegram/Slack/X; the app fetches the page meta and image.

## Driving it with curl
`check-http.sh` greps the page HTML for the meta tags and fetches three OG URLs (valid, invalid, empty), checking status, content-type, PNG dimensions, cache header. Open `<evidence>/http/og_valid.png` to eyeball that Chinese renders (no tofu).

## Gotchas
- `metadataBase` is `https://www.yourwords.me`, so og:image URLs in HTML are absolute to production even when testing locally — assert on the path.
- WeChat does not read OG for pasted links (known limitation).
