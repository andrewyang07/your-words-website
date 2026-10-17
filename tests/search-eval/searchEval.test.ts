import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { resetPagefindClientForTests, type PagefindModule } from '../../lib/search/pagefindClient';
import { runClientSearch } from '../../lib/search/runClientSearch';
import { getSearchEngine } from '../../lib/search/searchEngine';
import { evaluate, formatReport, type EvalQuery } from './evalHelpers';
import baseline from './baseline.json';

// Search eval (spec search-phase1-and-deploy-v1, T3): runs tests/search-eval/queries.json through both search paths
// against the real corpus. Fails only if the in-scope top-5 hit count drops below the recorded baseline.
// Regenerate the report and baseline with: SEARCH_EVAL_WRITE=1 npx vitest run tests/search-eval
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
    execFileSync('node', ['scripts/build-pagefind-index.mjs'], { cwd: root, stdio: 'ignore' });
  }
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const rel = url.replace(/^.*\/pagefind\//, '').split('?')[0]!;
    try {
      return new Response(fs.readFileSync(path.join(pagefindDir, rel)), { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
  const pagefind = (await import(
    /* @vite-ignore */ pathToFileURL(path.join(pagefindDir, 'pagefind.js')).href
  )) as PagefindModule & {
    options: (o: Record<string, unknown>) => Promise<void>;
    search: (t: string) => Promise<unknown>;
  };
  // Pagefind picks its query segmenter from <html lang>. Without a DOM it falls back to "unknown" and splits CJK
  // queries per character (不要忧虑明天 → 647 loose hits instead of 1), unlike the browser (lang="zh-Hans").
  // Present the site's lang only while the instance is created, then remove the stub.
  const g = globalThis as { document?: unknown };
  g.document = { querySelector: () => ({ getAttribute: () => 'zh-Hans' }) };
  try {
    await pagefind.options({ basePath: '/pagefind/', noWorker: true });
    await pagefind.search('神');
  } finally {
    delete g.document;
  }
  resetPagefindClientForTests(pagefind);
  await getSearchEngine().initialize();
});

const toRefs = (results: { bookKey: string; chapter: number; verse: number }[]) =>
  results.map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);

describe('search eval set', () => {
  it('has 50 queries; the first 21 are appendix A', () => {
    expect(queries).toHaveLength(50);
    expect(queries.slice(0, 21).every((q) => q.inScope)).toBe(true);
  });

  it('in-scope top-5 hits do not fall below the baseline (both paths)', async () => {
    const pagefind = await evaluate(queries, async (q) => toRefs((await runClientSearch(q)).results));
    const mini = await evaluate(queries, async (q) => toRefs((await getSearchEngine().searchWithMeta(q)).results));
    if (process.env.SEARCH_EVAL_WRITE) {
      fs.writeFileSync(path.join(here, 'baseline-report.md'), formatReport({ pagefind, mini }));
      const counts = { pagefind: pagefind.inScopeHits, mini: mini.inScopeHits, inScopeTotal: pagefind.inScopeTotal };
      fs.writeFileSync(path.join(here, 'baseline.json'), `${JSON.stringify(counts, null, 2)}\n`);
    }
    expect(pagefind.inScopeHits).toBeGreaterThanOrEqual(baseline.pagefind);
    expect(mini.inScopeHits).toBeGreaterThanOrEqual(baseline.mini);
  });
});
