---
name: verify-yourwords
description: Prove real behavior of the yourwords.me Next.js web app (home, search/favorites, /memorize incl. 背诵链接 ?p= ?s= ?v= ?create=1, /review redirect, /api/og/memorize, completion card) by launching the production build and driving it with curl + headless Playwright, capturing screenshots/PNGs/headers as evidence. Use before claiming a UI/route change works, when QA-ing a PR, or when asked to "verify"/"prove" app behavior.
---

# verify-yourwords

Surface: the Next.js 16 web app (App Router, client-side state in localStorage via zustand; no login).
Secondary surfaces: `/api/stats/*` + `/api/rankings` (need Upstash Redis env — not covered; they degrade without it).

All helpers live in `.cursor/skills/verify-yourwords/scripts/` and print `PASS|FAIL|SKIP <check>` lines plus a SUMMARY; non-zero exit on any FAIL.

## Quick start (one shot)

```bash
.cursor/skills/verify-yourwords/scripts/run-all.sh            # build if needed, launch, doctor, HTTP + browser checks, cleanup
.cursor/skills/verify-yourwords/scripts/run-all.sh --rebuild  # force `npm run build` first (do this after source edits)
```
Ends with `VERIFY PASS|FAIL  evidence: <dir>`. Evidence is in `.verify/evidence/<YYYYmmdd-HHMMSS>/` (gitignored) and survives cleanup; `.verify/evidence/latest-run` symlinks the last one.

Env knobs: `VERIFY_PORT` (default 3460), `VERIFY_REPO` (verify another checkout/worktree with these scripts, e.g. a PR branch worktree), `VERIFY_EVIDENCE`, `VERIFY_TOOLS` (default `~/.cache/verify-yourwords`, where `playwright-core@1.64.0` is installed — never added to package.json).

## Launch

```bash
.cursor/skills/verify-yourwords/scripts/launch.sh [--rebuild] [--dev]
```
- Prod (default): `npm run build` (only if `.next/BUILD_ID` missing or `--rebuild`; prebuild generates the pagefind search index, ~60s) then `next start -p $VERIFY_PORT` in its own process group. `--dev` uses `next dev` (slower first hits; search index may be missing).
- Ready when it prints `READY http://localhost:<port>` (it polls `GET /` until 200, max 90s). Build log: `.verify/build.log`; server log: `.verify/server-<port>.log`.
- Refuses to start if our pidfile is live or the port is taken by someone else. Two instances side by side: use different `VERIFY_PORT` and different checkouts (`VERIFY_REPO`) — one checkout has one `.next`, so don't build two branches in the same dir concurrently.

## Doctor (run first whenever something looks off)

```bash
.cursor/skills/verify-yourwords/scripts/doctor.sh
```
Read-only: our pid alive, `GET /` 200, server was started from current `HEAD` (WARN if not → `launch.sh --rebuild` after `cleanup.sh`), uncommitted source changes (stale build), BUILD_ID, playwright-core present.

## Drive

- HTTP: `scripts/check-http.sh` — status codes for every page route, 404 page, `/review` → `/memorize` redirect keeping the query, `/memorize` metadata (static vs dynamic og:image/twitter card), `/api/og/memorize` (200, `image/png`, 1200×630 parsed from PNG header, Cache-Control). Bodies/headers/PNGs saved under `<evidence>/http/`.
- Browser: `scripts/drive.sh [flow ...]` — headless Chromium, 430×932 mobile viewport, fresh context per flow (fresh localStorage), language seeded to 简体 (`your-words-app` key), first-visit guide dismissed via the "跳过引导" button. Flows: `home favorites memorizeDirect reciteLink reciteLinkEdgeCases createLink homeEntries` (default all). Screenshots `NN-<name>.png`, downloads (completion card, QR) and `results.json` in `<evidence>/browser/`. A failing flow gets a `NN-FAIL-<flow>.png` and the `drive.mjs:<line>` it died on.
- Share-link (背诵链接) checks auto-SKIP when `lib/reciteLink.ts` is absent (e.g. `main` before that PR merged).
- Stable handles used (keep them stable or update `drive.mjs`): ARIA names `加入我的收藏`/`取消我的收藏`, `跳过`/`跳过本轮`, headings `先读一遍，不急着记`/`本轮结束`, `生成背诵链接`, `链接标题`, `生成`, textbox `背诵链接网址`, img `背诵链接二维码`, `复制链接`, link `保存二维码`, `下一节`, `返回列表`, `生成卡片`, banner `role=alert` link `深度背诵`; localStorage keys `favorites-storage`, `your-words-app`.
- Feature-by-feature recipes: `features/README.md`.

## Evidence & proof standards

- Drive the real user path (click the star in search, click 生成, click 生成卡片). Seeding is limited to preferences (language) and, in `createLink` only, favorites — the `favorites` flow proves the UI path that produces that state.
- Capture the action and the result: screenshots before/after, downloaded files checked by PNG dimensions, localStorage diffed for side effects (e.g. "no new storage keys"), response headers saved.
- No mocks: everything runs against the production build. Headless limits: no `navigator.share` / system share sheet, clipboard works only because the flow grants permission, OG previews in chat apps and phone QR scanning cannot be observed — see "Manual" below.

## Cleanup

```bash
.cursor/skills/verify-yourwords/scripts/cleanup.sh
```
Kills only the process group from our pidfile (never by name), copies the server log into the evidence dir, removes pid/log. Evidence stays. `run-all.sh` calls it on exit (trap), including after failures. If you used `VERIFY_PORT`/`VERIFY_REPO`, export the same values for cleanup.

## Manual-only (state these as unverified in reports)

Phone QR scan, iOS/Android share sheets (link + card file share), desktop Firefox without `navigator.share`, clipboard *denied* path, link previews in iMessage/Telegram/Slack/X, WeChat in-app browser, visual quality of the completion card/OG on real devices.

## Maintenance

When routes, ARIA labels or flows change, update `features/*.md` and `scripts/drive.mjs`/`check-http.sh` in the same PR (see pstack `/maintain-verification-skill`).
