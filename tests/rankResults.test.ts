import { describe, expect, it } from 'vitest';
import { bigramCoverage, BIGRAM_TIER, rankResults } from '../lib/search/rankResults';
import type { SearchResult } from '../types/search';

const verse = (id: string, textChinese: string, score: number, textEnglish = ''): SearchResult => ({
  id,
  bookKey: '约翰福音',
  bookTraditional: '約翰福音',
  bookEnglish: 'John',
  chapter: 3,
  verse: Number(id.split('-').pop()),
  textChinese,
  textEnglish,
  score,
  matchType: 'keyword',
});

describe('rankResults (shared final ranking)', () => {
  it('orders the same candidates identically whatever the engine score scale', () => {
    const texts: [string, string][] = [
      ['j-1', '神爱世人，甚至将他的独生子赐给他们'],
      ['j-2', '世人都犯了罪'],
      ['j-3', '神就是爱'],
    ];
    const ctx = { query: '神爱世人', simplified: '神爱世人', variants: ['神爱世人'] };
    const small = rankResults(
      texts.map(([id, t], i) => verse(id, t, 3 - i)),
      ctx,
    ).map((r) => r.id);
    const big = rankResults(
      texts.map(([id, t], i) => verse(id, t, (3 - i) * 1e6)),
      ctx,
    ).map((r) => r.id);
    expect(small).toEqual(big);
    expect(small[0]).toBe('j-1');
  });

  it('bigram coverage beats engine rank', () => {
    const ranked = rankResults([verse('a-1', '无关经文', 99), verse('a-2', '不要忧虑', 1)], {
      query: '不要忧虑明天',
      simplified: '不要忧虑明天',
      variants: ['不要忧虑明天'],
    });
    expect(ranked.map((r) => r.id)).toEqual(['a-2', 'a-1']);
  });

  it('a whole-phrase hit ranks first and drops verses missing any query bigram', () => {
    const ranked = rankResults([verse('b-1', '要忧虑明天', 9), verse('b-2', '所以不要忧虑明天', 0)], {
      query: '不要忧虑明天',
      simplified: '不要忧虑明天',
      variants: ['不要忧虑明天'],
    });
    expect(ranked.map((r) => r.id)).toEqual(['b-2']);
  });

  it('bigramCoverage scales with the share of query bigrams found', () => {
    expect(bigramCoverage(['不要', '明天'], '不要怕')).toBe(BIGRAM_TIER / 2);
    expect(bigramCoverage([], 'x')).toBe(0);
  });

  it('applies the synonym / popularity hooks', () => {
    const ranked = rankResults([verse('p-1', '盼望', 2), verse('p-2', '盼望', 1)], {
      query: '盼望',
      simplified: '盼望',
      variants: ['盼望'],
      popularBoost: (r) => (r.id === 'p-2' ? 10_000 : 0),
    });
    expect(ranked[0]!.id).toBe('p-2');
  });

  it('English queries use whole-word relevance', () => {
    const ranked = rankResults([verse('e-1', '', 2, 'beloved, let us love'), verse('e-2', '', 1, 'God is love')], {
      query: 'God is love',
      simplified: 'God is love',
      variants: ['God is love'],
    });
    expect(ranked[0]!.id).toBe('e-2');
  });
});
