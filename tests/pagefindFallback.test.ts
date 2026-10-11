import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installPagefindFetchTracker,
  resetPagefindClientForTests,
  type PagefindModule,
} from '../lib/search/pagefindClient';
import { runClientSearch } from '../lib/search/runClientSearch';
import type { SearchResult } from '../types/search';

const miniSearchHit: SearchResult = {
  id: '约翰福音-3-16',
  bookKey: '约翰福音',
  bookTraditional: '約翰福音',
  bookEnglish: 'John',
  chapter: 3,
  verse: 16,
  textChinese: '神爱世人',
  textEnglish: '',
  score: 1,
  matchType: 'keyword',
};

const engine = vi.hoisted(() => ({ calls: 0 }));
vi.mock('../lib/search/searchEngine', () => ({
  getSearchEngine: () => ({
    initialized: true,
    initialize: async () => undefined,
    searchWithMeta: async () => {
      engine.calls += 1;
      return { results: [miniSearchHit], truncated: false };
    },
  }),
}));

// Fake network: files of the current deploy exist; hashes from an old deploy 404.
const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new Response('x', { status: url.includes('old_') ? 404 : 200 });
});
const fakeGlobal = { fetch: fetchMock } as unknown as typeof globalThis;
installPagefindFetchTracker(fakeGlobal);

function fakePagefind(opts: { indexChunk: string; data?: () => Promise<unknown> }): PagefindModule {
  return {
    search: async () => {
      // Pagefind fetches index chunks, logs a failed one ("invalid gzip data") and resolves with no results.
      await fakeGlobal.fetch(opts.indexChunk).catch(() => undefined);
      return {
        results: opts.data ? [{ id: 'r1', data: opts.data as () => Promise<never> }] : [],
      };
    },
  };
}

beforeEach(() => {
  engine.calls = 0;
  resetPagefindClientForTests();
});

describe('Pagefind → MiniSearch fallback', () => {
  it('falls back when an index chunk 404s (stale cached pagefind-entry.json / open tab after deploy)', async () => {
    resetPagefindClientForTests(fakePagefind({ indexChunk: '/pagefind/index/old_abc.pf_index' }));
    const { results } = await runClientSearch('神爱世人');
    expect(engine.calls).toBe(1);
    expect(results).toEqual([miniSearchHit]);
  });

  it('falls back when a fragment load rejects', async () => {
    resetPagefindClientForTests(
      fakePagefind({
        indexChunk: '/pagefind/index/new.pf_index',
        data: () => Promise.reject(new Error('invalid gzip data')),
      }),
    );
    const { results } = await runClientSearch('神爱世人');
    expect(engine.calls).toBe(1);
    expect(results).toEqual([miniSearchHit]);
  });

  it('falls back when a fragment load resolves with no data', async () => {
    resetPagefindClientForTests(
      fakePagefind({ indexChunk: '/pagefind/index/new.pf_index', data: () => Promise.resolve(undefined) }),
    );
    await runClientSearch('神爱世人');
    expect(engine.calls).toBe(1);
  });

  it('keeps a genuine empty result when every load succeeded', async () => {
    resetPagefindClientForTests(fakePagefind({ indexChunk: '/pagefind/index/new.pf_index' }));
    const { results } = await runClientSearch('zzqq');
    expect(engine.calls).toBe(0);
    expect(results).toEqual([]);
  });

  it('falls back when Pagefind itself throws', async () => {
    resetPagefindClientForTests({
      search: () => Promise.reject(new Error('wasm failed')),
    });
    await runClientSearch('神爱世人');
    expect(engine.calls).toBe(1);
  });
});
