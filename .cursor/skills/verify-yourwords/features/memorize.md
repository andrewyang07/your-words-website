# Deep memorize (深度背诵)

## Sub-features
- Picker of favorites (`/memorize`), 4 stages 通读/轻遮/深遮/首字母, each skippable; completion page 本轮结束 with seal.
- `?v=<bookId>-<ch>-<vs>` starts that verse directly. `/review?…` redirects to `/memorize?…` keeping the query.

## How to get to it (user POV)
Home → 深度背诵, or a direct link `/memorize?v=43-3-16`.

## Driving it with Playwright
`drive.sh memorizeDirect`: open `?v=43-3-16`, dismiss guide, click `跳过` ×3 then `跳过本轮`, wait for heading `本轮结束`. HTTP: `/review?p=43-3-16&sv=1` → 307 `/memorize?p=43-3-16&sv=1`.

## Gotchas
- The first-visit guide dialog opens asynchronously and blocks clicks — call `dismissGuide` after the target content is visible.
- Recall keys are disabled until the pinyin model lazy-loads; skipping avoids that wait. To test typing, wait for the key button to be enabled.
