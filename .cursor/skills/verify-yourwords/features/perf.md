# Performance budgets (`check-perf.sh`)

Gate against perf regressions on `/`, `/search`, `/memorize`, `/note`.

- Run: `scripts/run-all.sh --perf` (or `scripts/check-perf.sh` with a prod server from `launch.sh`; `--measure` prints numbers without failing).
- Measures per route: First Load JS (gzip KB of every `<script src>` in the route's HTML) and Lighthouse 12 mobile (score, LCP, TBT, CLS) against the local `next start` build.
- Budgets: `perf-budgets.json` (current value + ~5–10% margin, set 2026-10-11 on main 7fab4f7; baseline in `measured`). A PR that improves a number should tighten its budget; loosening needs a reason in the PR.
- Runs: each route gets 3 Lighthouse runs by default and score/LCP/TBT/CLS budgets are compared on the **median** (single runs swing ~1.1–1.5 s on TBT). Override with `VERIFY_PERF_RUNS=N` (env wins) or `runs` in `perf-budgets.json`. Output prints per-run values plus the median; `summary.json` keeps both. A `run-all.sh --perf` run takes ~5–12 min on the shared box.
- TBT is a soft gate (`"tbtMode": "warn"` in `perf-budgets.json`): a median over `maxTbtMs` prints WARN and does not fail, unless it exceeds `maxTbtMs × tbtHardFactor` (1.5), which FAILs. Set `"tbtMode": "hard"` for a strict gate. Score is soft the same way (`"scoreMode": "warn"`, `"scoreHardMargin": 5`): up to 5 points under `minScore` = WARN, more = FAIL. LCP, CLS and First Load JS are always hard gates.
- Evidence: `$VERIFY_EVIDENCE/perf/` (Lighthouse JSON/HTML + `summary.json`).
- Caveats: local numbers ≠ production (no CDN, simulated throttling on a shared box); Lighthouse varies ±10% run to run (TBT more) — raise `VERIFY_PERF_RUNS` / `runs` if the median still flakes; don't loosen budgets for noise. Uses Chromium + lighthouse from `$VERIFY_TOOLS` (auto-installed by `ensure-tools.sh`) unless `CHROME_PATH` is set. Does not cover real-device INP or field Core Web Vitals (see Vercel Speed Insights).
- Known hot spots at baseline: `/search` builds the MiniSearch index on load (TBT ~38s mobile), CJK Noto Sans SC font slices (~1.1 MB), `/` fetches CUVT_bible.json (1.2 MB br).
