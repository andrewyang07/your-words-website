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
const get = async (u) => { for (let i = 0; ; i++) { try { const r = await fetch(u, { headers: { connection: 'close' } }); return Buffer.from(await r.arrayBuffer()); } catch (e) { if (i >= 3) throw e; await new Promise((ok) => setTimeout(ok, 500)); } } };
let fails = 0; const rows = [];
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
  const scores = [], lcp = [], tbt = [], cls = [];
  for (let i = 0; i < (budgets.runs || 1); i++) {
    const out = `${ev}/perf/lh-${tag}-${i}`;
    execFileSync('npx', ['-y', 'lighthouse@12', base + route, '--only-categories=performance', '--output=json', '--output=html',
      `--output-path=${out}`, '--quiet', '--chrome-flags=--headless=new --no-sandbox'], { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chrome } });
    const r = JSON.parse(readFileSync(`${out}.report.json`, 'utf8'));
    scores.push(Math.round(r.categories.performance.score * 100));
    lcp.push(Math.round(r.audits['largest-contentful-paint'].numericValue));
    tbt.push(Math.round(r.audits['total-blocking-time'].numericValue));
    cls.push(+r.audits['cumulative-layout-shift'].numericValue.toFixed(3));
  }
  const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const m = { route, firstLoadJsKb: jsKb, score: med(scores), lcpMs: med(lcp), tbtMs: med(tbt), cls: med(cls) };
  rows.push(m);
  verdict(`${route} score`, m.score, b.minScore, (v, mn) => v >= mn);
  verdict(`${route} lcpMs`, m.lcpMs, b.maxLcpMs);
  verdict(`${route} tbtMs`, m.tbtMs, b.maxTbtMs);
  verdict(`${route} cls`, m.cls, b.maxCls);
}
writeFileSync(`${ev}/perf/summary.json`, JSON.stringify(rows, null, 2));
console.log(`SUMMARY perf: ${fails} fail(s)  evidence: ${ev}/perf`);
process.exit(fails ? 1 : 0);
