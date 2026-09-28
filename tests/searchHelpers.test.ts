import { describe, expect, it } from 'vitest';
import {
  detectSearchLangFromQuery,
  formatResultCount,
  hasCjk,
  phraseScore,
  rankByPhraseVariants,
} from '../lib/search/searchHelpers';
import type { SearchResult } from '../types/search';

function verse(
  partial: Partial<SearchResult> & Pick<SearchResult, 'id' | 'textChinese' | 'score'>
): SearchResult {
  return {
    bookKey: '约翰福音',
    bookTraditional: '約翰福音',
    bookEnglish: 'John',
    chapter: 3,
    verse: 16,
    textEnglish: '',
    matchType: 'keyword',
    ...partial,
  };
}

describe('hasCjk / detectSearchLangFromQuery', () => {
  it('detects CJK in traditional and simplified queries', () => {
    expect(hasCjk('神愛世人')).toBe(true);
    expect(hasCjk('神爱世人')).toBe(true);
    expect(hasCjk('love')).toBe(false);
    expect(hasCjk('John 3:16')).toBe(false);
    expect(hasCjk('')).toBe(false);
  });

  it('defaults searchLang to zh for CJK and en for Latin-only queries', () => {
    expect(detectSearchLangFromQuery('神愛世人')).toBe('zh');
    expect(detectSearchLangFromQuery('神爱世人')).toBe('zh');
    expect(detectSearchLangFromQuery(' 永生 ')).toBe('zh');
    expect(detectSearchLangFromQuery('love')).toBe('en');
    expect(detectSearchLangFromQuery('God so loved')).toBe('en');
    expect(detectSearchLangFromQuery('')).toBeNull();
    expect(detectSearchLangFromQuery('   ')).toBeNull();
  });
});

describe('formatResultCount', () => {
  it('shows plain count when not truncated', () => {
    expect(formatResultCount(12, { traditional: false })).toBe('找到 12 条结果');
    expect(formatResultCount(12, { traditional: true })).toBe('找到 12 條結果');
  });

  it('shows 50+ when truncated at the cap', () => {
    expect(formatResultCount(50, { truncated: true, traditional: false })).toBe(
      '找到 50+ 条结果'
    );
    expect(formatResultCount(50, { truncated: true, traditional: true })).toBe(
      '找到 50+ 條結果'
    );
  });

  it('does not add plus when truncated is false even at 50', () => {
    expect(formatResultCount(50, { truncated: false })).toBe('找到 50 条结果');
  });
});

describe('phraseScore / rankByPhraseVariants (John 3:16 fixture)', () => {
  const john316Trad = verse({
    id: '约翰福音-3-16',
    chapter: 3,
    verse: 16,
    textChinese: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不致滅亡，反得永生。',
    textEnglish: 'For God so loved the world...',
    score: 10,
  });

  const john317Trad = verse({
    id: '约翰福音-3-17',
    chapter: 3,
    verse: 17,
    textChinese:
      '因為神差他的兒子降世，不是要定世人的罪，乃是要叫世人因他得救。',
    textEnglish: 'For God did not send his Son...',
    // Higher BM25-like base score (the MiniSearch bug for traditional queries)
    score: 176,
  });

  const john316Simp = verse({
    id: '约翰福音-3-16',
    chapter: 3,
    verse: 16,
    textChinese: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不致灭亡，反得永生。',
    score: 10,
  });

  it('boosts exact traditional phrase so 3:16 outranks higher BM25 3:17', () => {
    const ranked = rankByPhraseVariants(
      [john317Trad, john316Trad],
      ['神愛世人']
    );
    expect(ranked[0].id).toBe('约翰福音-3-16');
    expect(phraseScore('神愛世人', john316Trad)).toBeGreaterThan(
      phraseScore('神愛世人', john317Trad)
    );
  });

  it('boosts simplified phrase against simplified text', () => {
    const john317Simp = verse({
      id: '约翰福音-3-17',
      chapter: 3,
      verse: 17,
      textChinese: '因为神差他的儿子降世，不是要定世人的罪，乃是要叫世人因他得救。',
      score: 176,
    });
    const ranked = rankByPhraseVariants(
      [john317Simp, john316Simp],
      ['神爱世人']
    );
    expect(ranked[0].id).toBe('约翰福音-3-16');
  });

  it('ranks 3:16 first when OpenCC supplies both script variants', async () => {
    const opencc = (await import('opencc-js')) as unknown as {
      Converter: (options: { from: string; to: string }) => (value: string) => string;
    };
    const toTraditional = opencc.Converter({ from: 'cn', to: 'tw' });
    const toSimplified = opencc.Converter({ from: 'tw', to: 'cn' });

    for (const query of ['神愛世人', '神爱世人'] as const) {
      const variants = [query, toTraditional(query), toSimplified(query)];
      // Pagefind meta textChinese is traditional (CUVT)
      const ranked = rankByPhraseVariants([john317Trad, john316Trad], variants);
      expect(ranked[0].id).toBe('约翰福音-3-16');
    }
  });
});
