# 背诵链接 (recite share link)

## Sub-features
- Receive: `/memorize?p=<refs>&t=<title>&sv=1` (refs `43-3-16`, `19-23-1~6`, comma list; max 50) → list titled `t` or 背诵链接, "共 N 节"; click → 4 stages; completion shows 下一节 (not on last), 返回列表; ✓ 已背完 in memory only.
- Legacy `?s=` → same list. Notices: 有 N 处引用无法识别，已略过 / 仅显示前 50 节 / 此链接来自较新版本…; all invalid → 链接中没有可背诵的经文 + 去我的收藏.
- Create: picker 生成背诵链接 (or `/memorize?create=1`) → checkboxes (default first 50) + 链接标题 → 生成 → dialog: QR, URL, 分享 (only if `navigator.share`), 复制链接, 保存二维码.
- Completion card: 生成卡片 → 1080×1350 PNG, file share or download `yourwords-<bookKey>-<ch>-<vs>.png`.

## How to get to it (user POV)
Someone sends you the link; or you open 深度背诵 with favorites and tap 生成背诵链接; or home 收藏 filter → 背诵链接.

## Driving it with Playwright
- `drive.sh reciteLink`: `?p=19-23-1~3&t=诗篇23&sv=1` → order check → item 2 → skip round → 下一节 visible → 生成卡片 download (PNG 1080×1350) → 返回列表 → ✓ on item 2 → reload → ✓ gone → localStorage diff shows no new keys.
- `drive.sh reciteLinkEdgeCases`: invalid notice, empty state + sv=2 notice, `?s=` list.
- `drive.sh createLink`: seeded 3 favorites, `?create=1`, title 小组, 生成 → URL regex, QR img, 复制链接 status, 保存二维码 PNG, recipient context opens the URL and sees heading 小组.

## Gotchas
- Headless has no `navigator.share`, so the 分享 button is absent and the card downloads instead of sharing.
- Headless UI's `role=dialog` root is zero-size; wait on the dialog's textbox, not the dialog.
- `user-tracked` localStorage key is set by stats tracking (pre-existing), not by this feature.
