import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  couldBePinyin,
  resetPagefindClientForTests,
  searchWithPagefind,
  type PagefindModule,
} from '../lib/search/pagefindClient';
import { runClientSearch } from '../lib/search/runClientSearch';
import { appendNewResults, mergeKeepingVisible } from '../lib/search/searchHelpers';

vi.mock('../lib/search/referenceFirst', async (orig) => {
  const actual = await orig<typeof import('../lib/search/referenceFirst')>();
  return {
    ...actual,
    loadBooks: async () => [{ key: '约翰福音', nameEnglish: 'John', order: 43, chapters: 21 }],
    loadVersesFromCorpus: async () => [],
  };
});

const verse = (id: string, text: string) => ({
  id,
  data: async () => ({
    url: `/verse/${id}`,
    meta: {
      id,
      bookKey: '约翰福音',
      bookTraditional: '約翰福音',
      bookEnglish: 'John',
      chapter: '3',
      verse: id.split('-').pop()!,
      textChinese: text,
      textSimplified: text,
      textEnglish: text,
    },
  }),
});

/** Fake Pagefind instance that records every term it is asked for. */
function fake(hits: (term: string) => ReturnType<typeof verse>[]) {
  const terms: string[] = [];
  const instance: PagefindModule = {
    search: async (term) => {
      terms.push(term);
      return { results: hits(term) };
    },
  };
  return { module: instance, terms };
}

let main: ReturnType<typeof fake>;
let pinyin: ReturnType<typeof fake>;

beforeEach(() => {
  // "love": many main-index hits (above FEW_MAIN_HITS), so the pinyin index waits for the main results.
  main = fake((term) =>
    /love/i.test(term)
      ? [verse('约翰福音-3-35', 'love'), ...Array.from({ length: 14 }, (_, i) => verse(`约翰福音-4-${i + 1}`, 'x'))]
      : [],
  );
  pinyin = fake((term) => (term.startsWith('p') ? [verse('约翰福音-3-16', '神爱世人')] : []));
  resetPagefindClientForTests(main.module, pinyin.module);
});

describe('two-index routing (main + pinyin)', () => {
  it('couldBePinyin: Latin pinyin / initials only', () => {
    expect(couldBePinyin('sasr')).toBe(true);
    expect(couldBePinyin('shen ai shi ren')).toBe(true);
    expect(couldBePinyin('an')).toBe(true);
    expect(couldBePinyin('love')).toBe(true);
    expect(couldBePinyin('神爱世人')).toBe(false);
    expect(couldBePinyin('John 3:16')).toBe(false);
  });

  it('CJK queries never touch the pinyin index', async () => {
    await runClientSearch('神爱世人', undefined, { onPinyinResults: () => undefined });
    await runClientSearch('神爱世人');
    expect(pinyin.terms).toEqual([]);
  });

  it('two-step: main results first without the pinyin index, merged results later', async () => {
    const onPinyinResults = vi.fn();
    const first = await runClientSearch('sasr', undefined, { onPinyinResults });
    expect(first.results).toEqual([]);
    await vi.waitFor(() => expect(onPinyinResults).toHaveBeenCalledTimes(1));
    expect(onPinyinResults.mock.calls[0]![0].results.map((r: { id: string }) => r.id)).toEqual(['约翰福音-3-16']);
    // The main index never sees pinyin tokens.
    expect(main.terms.some((t) => /^p[ytibfj]/.test(t))).toBe(false);
  });

  it('English results come first and keep their place after the pinyin merge', async () => {
    const onPinyinResults = vi.fn();
    const first = await runClientSearch('love', undefined, { onPinyinResults });
    expect(first.results[0]!.id).toBe('约翰福音-3-35');
    expect(pinyin.terms).toEqual([]);
    await vi.waitFor(() => expect(onPinyinResults).toHaveBeenCalledTimes(1));
    expect(onPinyinResults.mock.calls[0]![0].results[0].id).toBe('约翰福音-3-35');
  });

  it('few main hits (sasr): pinyin results are released only after the main results', async () => {
    const onPinyinResults = vi.fn();
    await runClientSearch('sasr', undefined, { onPinyinResults });
    expect(onPinyinResults).not.toHaveBeenCalled(); // released only after the caller has shown the main list
    await vi.waitFor(() => expect(onPinyinResults).toHaveBeenCalledTimes(1));
  });

  it('without the callback (eval / one-shot callers) results already include pinyin', async () => {
    const { results } = await runClientSearch('sasr');
    expect(results.map((r) => r.id)).toEqual(['约翰福音-3-16']);
  });

  it('a pinyin index that fails to load leaves the main results', async () => {
    resetPagefindClientForTests(main.module); // /pagefind/pinyin-0/pagefind.js cannot be imported here
    const { results } = await runClientSearch('love');
    expect(results[0]!.id).toBe('约翰福音-3-35');
  });

  it('first screen loads at most 10 pinyin fragments per search; loadMore gets the rest', async () => {
    const many = Array.from({ length: 15 }, (_, i) => verse(`约翰福音-5-${i + 1}`, 'x'));
    let loaded = 0;
    const counted = many.map((v) => ({ ...v, data: () => ((loaded += 1), v.data()) }));
    resetPagefindClientForTests(main.module, { search: async (t) => ({ results: t.startsWith('p') ? counted : [] }) });
    const first = await searchWithPagefind('sasr', 50, { pinyin: true, pinyinTop: 10 });
    expect(first.results).toHaveLength(10);
    expect(first.loadMore).toBeTypeOf('function');
    const full = await first.loadMore!();
    expect(full.results).toHaveLength(15);
    expect(full.loadMore).toBeUndefined();
    expect(loaded).toBeGreaterThanOrEqual(15);
  });

  it('a search superseded while typing returns nothing and does not fall back to MiniSearch', async () => {
    const response = await runClientSearch('love', undefined, { isCurrent: () => false });
    expect(response).toEqual({ results: [], truncated: false });
  });

  it('pinyin results merge by score below the results on screen (visible ones never move)', async () => {
    // Pinyin ranks 3:16 first. Two of love's main results are on screen: they stay, 3:16 comes right after them.
    const onPinyinResults = vi.fn();
    const first = await runClientSearch('love', undefined, { onPinyinResults, visibleCount: () => 2 });
    await vi.waitFor(() => expect(onPinyinResults).toHaveBeenCalledTimes(1));
    const merged = onPinyinResults.mock.calls[0]![0] as { results: { id: string }[] };
    expect(merged.results.slice(0, 2).map((r) => r.id)).toEqual(first.results.slice(0, 2).map((r) => r.id));
    expect(new Set(merged.results.map((r) => r.id)).size).toBe(merged.results.length);
  });
});

describe('mergeKeepingVisible', () => {
  const r = (id: string) => ({ id }) as never;
  const ids = (x: { results: { id: string }[] }) => x.results.map((y) => y.id);
  it('keeps the visible head, merged score order below it', () => {
    const out = mergeKeepingVisible(
      [r('a'), r('b'), r('c')],
      { results: [r('p'), r('c'), r('a'), r('b')], truncated: false },
      1,
    );
    expect(ids(out)).toEqual(['a', 'p', 'c', 'b']);
  });
  it('nothing visible: merged list as-is', () => {
    const incoming = { results: [r('p'), r('a')], truncated: false };
    expect(mergeKeepingVisible([r('a')], incoming, 0)).toBe(incoming);
  });
});

describe('appendNewResults', () => {
  const r = (id: string) => ({ id }) as never;
  it('keeps shown order and appends only new ids', () => {
    const out = appendNewResults([r('a'), r('b')], { results: [r('c'), r('b'), r('a'), r('d')], truncated: false });
    expect(out.results.map((x: { id: string }) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('nothing shown: incoming list as-is', () => {
    const incoming = { results: [r('c'), r('d')], truncated: true };
    expect(appendNewResults([], incoming)).toBe(incoming);
  });
  it('loadMore stays append-only', async () => {
    const out = appendNewResults([r('a')], {
      results: [r('b'), r('a')],
      truncated: true,
      loadMore: async () => ({ results: [r('z'), r('b'), r('a'), r('c')], truncated: false }),
    });
    const more = await out.loadMore!();
    expect(more.results.map((x: { id: string }) => x.id)).toEqual(['a', 'b', 'z', 'c']);
  });
});
