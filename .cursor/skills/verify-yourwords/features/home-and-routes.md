# Home & page routes

## Sub-features
- `/` verse browsing, filters, 收藏 filter with "复制收藏链接" and (with 背诵链接) "背诵链接" → `/memorize?create=1`.
- Shared favorites `/?s=<ids>`: banner (`role=alert`) with 深度背诵 / 一键收藏 / 取消.
- Other pages: `/search`, `/discover`, `/rankings`, `/note`, `/help`, `/about`, `/sitemap.xml`, custom 404.

## How to get to it (user POV)
Open the site; bottom/global nav (`nav[aria-label="主要頁面"]`) links pages. A friend's shared link lands on `/?s=…`.

## Driving it with curl / Playwright
- `check-http.sh` asserts 200 for each route and 404 for an unknown one.
- `drive.sh home` (no page errors + screenshot), `drive.sh homeEntries` (banner 深度背诵 href is `/memorize?s=<same s>`).

## Gotchas
- Default language is 繁體; flows seed 简体 via `your-words-app`. Text assertions must match the seeded language.
- `/api/rankings` / stats need Redis env; the home stats widgets degrade silently without it.
