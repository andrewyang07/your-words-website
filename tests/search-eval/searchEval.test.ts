import fs from 'node:fs';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { loadRealPagefind } from '../helpers/realPagefind';
import { runClientSearch } from '../../lib/search/runClientSearch';
import { getSearchEngine } from '../../lib/search/searchEngine';
import { evaluate, formatReport, hitIds, regressions, type EvalQuery } from './evalHelpers';
import baseline from './baseline.json';

// Search eval (spec search-phase1-and-deploy-v1, T3): runs tests/search-eval/queries.json through both search paths
// against the real corpus. Fails if any query that hit in baseline.json is now a miss (diff printed).
// Run: npm run test:search-eval. Regenerate report + baseline: SEARCH_EVAL_WRITE=1 npm run test:search-eval
const root = process.cwd();
const pagefindDir = path.join(root, 'public', 'pagefind');
const here = path.join(root, 'tests', 'search-eval');
const queries = (JSON.parse(fs.readFileSync(path.join(here, 'queries.json'), 'utf8')) as { queries: EvalQuery[] })
  .queries;

vi.mock('../../lib/bibleDataCache', () => ({
  fetchWithCache: async (url: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', url), 'utf8')),
}));
vi.setConfig({ testTimeout: 180_000, hookTimeout: 240_000 });

beforeAll(async () => {
  if (!fs.existsSync(path.join(pagefindDir, 'pagefind.js'))) {
    // Built once up front (CI step / npm run test:search-eval), never inside a test: parallel test files each
    // running the build would rm -rf public/pagefind under each other.
    throw new Error('public/pagefind is missing. Run `npm run search:build-index` first.');
  }
  await loadRealPagefind();
  await getSearchEngine().initialize();
});

/** Written files match the repo's Prettier config, so regenerating never leaves format:check red. */
async function writePretty(file: string, text: string, parser: 'json' | 'markdown') {
  fs.writeFileSync(file, await format(text, { ...(await resolveConfig(file)), parser }));
}

const toRefs = (results: { bookKey: string; chapter: number; verse: number }[]) =>
  results.map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);

describe('search eval set', () => {
  it('has 50 queries; the first 21 are appendix A', () => {
    expect(queries).toHaveLength(50);
    expect(queries.slice(0, 21).every((q) => q.inScope)).toBe(true);
  });

  it('no query that hit in the baseline becomes a miss (both paths)', async () => {
    const pagefind = await evaluate(queries, async (q) => toRefs((await runClientSearch(q)).results));
    const mini = await evaluate(queries, async (q) => toRefs((await getSearchEngine().searchWithMeta(q)).results));
    if (process.env.SEARCH_EVAL_WRITE) {
      await writePretty(path.join(here, 'baseline-report.md'), formatReport({ pagefind, mini }), 'markdown');
      const next = {
        inScopeTotal: pagefind.inScopeTotal,
        pagefind: { inScopeHits: pagefind.inScopeHits, hitIds: hitIds(pagefind) },
        mini: { inScopeHits: mini.inScopeHits, hitIds: hitIds(mini) },
      };
      await writePretty(path.join(here, 'baseline.json'), JSON.stringify(next), 'json');
      return;
    }
    const lost = [
      ...regressions('Pagefind', baseline.pagefind.hitIds, pagefind),
      ...regressions('MiniSearch', baseline.mini.hitIds, mini),
    ];
    if (lost.length > 0) console.error(`Search eval regressions:\n${lost.join('\n')}`);
    expect(lost).toEqual([]);
  });
});

// Spec §3.2 (T4): on a fixed set of 20 queries both engines put the same verses in the same order in the top 5.
// Pagefind's word segmentation often returns fewer candidates (e.g. only the matching verse), so the shorter list
// must be a non-empty prefix of the longer one rather than an exact match of all five.
const PARITY_IDS = [2, 3, 7, 9, 12, 13, 14, 15, 16, 17, 18, 21, 28, 31, 32, 34, 36, 40, 41, 45];

describe('engine parity (T4: shared rankResults)', () => {
  it('Pagefind and MiniSearch agree on the top 5 for the 20 parity queries', async () => {
    const diffs: string[] = [];
    for (const q of queries.filter((x) => PARITY_IDS.includes(x.id))) {
      const a = toRefs((await runClientSearch(q.query)).results).slice(0, 5);
      const b = toRefs((await getSearchEngine().searchWithMeta(q.query)).results).slice(0, 5);
      const n = Math.min(a.length, b.length);
      if (n === 0) {
        // Approved rule (roro, 2026-10-18): the shorter list must be non-empty; an empty result never counts as parity.
        diffs.push(`#${q.id} ${q.query}: empty result (Pagefind ${a.length}, MiniSearch ${b.length})`);
      } else if (a.slice(0, n).join() !== b.slice(0, n).join()) {
        diffs.push(`#${q.id} ${q.query}: Pagefind ${a.join('; ')} | MiniSearch ${b.join('; ')}`);
      }
    }
    expect(diffs).toEqual([]);
  });
});
