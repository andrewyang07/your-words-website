// Perf budget gate: First Load JS (gzip of route's <script src> chunks) + Lighthouse mobile per route.
// Usage: node check-perf.mjs <base> <budgets.json> <evidenceDir> [--measure]  (--measure: print numbers, never fail)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
const [base, budgetFile, ev, flag] = process.argv.slice(2);
const measure = flag === '--measure';
const budgets = JSON.parse(readFileSync(budgetFile, 'utf8'));
mkdirSync(`${ev}/perf`, { recursive: true });
const chrome = process.env.CHROME_PATH;
// Lighthouse runs per route; budgets compare the MEDIAN. Precedence: VERIFY_PERF_RUNS env > budgets.runs > 3.
const runs = Math.max(1, parseInt(process.env.VERIFY_PERF_RUNS || budgets.runs || 3, 10) || 3);
console.log(`INFO perf: ${runs} Lighthouse run(s) per route, budgets compared on the median`);
const get = async (u) => {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(u, { headers: { connection: 'close' } });
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i >= 3) throw e;
      await new Promise((ok) => setTimeout(ok, 500));
    }
  }
};
let fails = 0,
  warns = 0;
// TBT is noisy on a shared box. tbtMode "warn" (default): over budget = WARN, over budget x tbtHardFactor (1.5) = FAIL. "hard": plain budget.
const tbtMode = budgets.tbtMode || 'warn';
const tbtHard = budgets.tbtHardFactor || 1.5;
// Score is mostly TBT-weighted, so same idea: scoreMode "warn" (default): under budget by <= scoreHardMargin (5) = WARN, more = FAIL.
const scoreMode = budgets.scoreMode || 'warn';
const scoreMargin = budgets.scoreHardMargin ?? 5;
const rows = [];
const verdict = (name, val, max, cmp = (v, m) => v <= m) => {
  const ok = measure || !max || cmp(val, max);
  if (!ok) fails++;
  console.log(`${measure ? 'INFO' : ok ? 'PASS' : 'FAIL'} perf ${name} = ${val}${max ? ` (budget ${max})` : ''}`);
};
for (const [route, b] of Object.entries(budgets.routes)) {
  const html = (await get(base + route)).toString();
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
  let gz = 0;
  for (const s of srcs) gz += gzipSync(await get(new URL(s, base))).length;
  const jsKb = Math.round(gz / 1024);
  verdict(`${route} firstLoadJsKb`, jsKb, b.firstLoadJsKb);
  const tag = route === '/' ? 'home' : route.slice(1);
  const scores = [],
    lcp = [],
    tbt = [],
    cls = [];
  for (let i = 0; i < runs; i++) {
    const out = `${ev}/perf/lh-${tag}-${i}`;
    execFileSync(
      'lighthouse',
      [
        base + route,
        '--only-categories=performance',
        '--output=json',
        '--output=html',
        `--output-path=${out}`,
        '--quiet',
        '--chrome-flags=--headless=new --no-sandbox',
      ],
      { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chrome } },
    );
    const r = JSON.parse(readFileSync(`${out}.report.json`, 'utf8'));
    scores.push(Math.round(r.categories.performance.score * 100));
    lcp.push(Math.round(r.audits['largest-contentful-paint'].numericValue));
    tbt.push(Math.round(r.audits['total-blocking-time'].numericValue));
    cls.push(+r.audits['cumulative-layout-shift'].numericValue.toFixed(3));
  }
  const med = (a) => {
    const s = [...a].sort((x, y) => x - y),
      h = Math.floor(s.length / 2);
    return s.length % 2 ? s[h] : +((s[h - 1] + s[h]) / 2).toFixed(3);
  };
  console.log(`INFO perf ${route} runs score=[${scores}] lcpMs=[${lcp}] tbtMs=[${tbt}] cls=[${cls}]`);
  const m = {
    route,
    runs,
    perRun: { score: scores, lcpMs: lcp, tbtMs: tbt, cls },
    firstLoadJsKb: jsKb,
    score: med(scores),
    lcpMs: med(lcp),
    tbtMs: med(tbt),
    cls: med(cls),
  };
  rows.push(m);
  if (scoreMode === 'warn' && !measure && b.minScore && m.score < b.minScore) {
    const hard = b.minScore - scoreMargin;
    if (m.score < hard) {
      fails++;
      console.log(`FAIL perf ${route} score (median) = ${m.score} (budget ${b.minScore}, hard limit ${hard})`);
    } else {
      warns++;
      console.log(
        `WARN perf ${route} score (median) = ${m.score} (budget ${b.minScore}, soft gate; FAIL below ${hard})`,
      );
    }
  } else verdict(`${route} score (median)`, m.score, b.minScore, (v, mn) => v >= mn);
  verdict(`${route} lcpMs (median)`, m.lcpMs, b.maxLcpMs);
  if (tbtMode === 'warn' && !measure && b.maxTbtMs && m.tbtMs > b.maxTbtMs) {
    const hard = Math.round(b.maxTbtMs * tbtHard);
    if (m.tbtMs > hard) {
      fails++;
      console.log(`FAIL perf ${route} tbtMs (median) = ${m.tbtMs} (budget ${b.maxTbtMs}, hard limit ${hard})`);
    } else {
      warns++;
      console.log(
        `WARN perf ${route} tbtMs (median) = ${m.tbtMs} (budget ${b.maxTbtMs}, soft gate; FAIL above ${hard})`,
      );
    }
  } else verdict(`${route} tbtMs (median)`, m.tbtMs, b.maxTbtMs);
  verdict(`${route} cls (median)`, m.cls, b.maxCls);
}
writeFileSync(`${ev}/perf/summary.json`, JSON.stringify(rows, null, 2));
console.log(`SUMMARY perf: ${fails} fail(s), ${warns} warn(s)  evidence: ${ev}/perf`);
process.exit(fails ? 1 : 0);
