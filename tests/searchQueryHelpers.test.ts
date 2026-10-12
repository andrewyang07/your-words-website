import { describe, expect, it } from 'vitest';
import { MAX_QUERY_LENGTH, clampQuery, normalizeSpacedReference } from '../lib/search/searchHelpers';
import { englishRelevance, requireAllBigramsWhenPhraseHits } from '../lib/search/pagefindClient';
import type { SearchResult } from '../types/search';

const r = (id: string, textSimplified: string): SearchResult => ({
  id,
  bookKey: id,
  bookTraditional: id,
  bookEnglish: '',
  chapter: 1,
  verse: 1,
  textChinese: textSimplified,
  textSimplified,
  textEnglish: '',
  score: 0,
  matchType: 'keyword',
});

describe('query helpers', () => {
  it.each([
    ['Jn 3 16', 'Jn 3:16'],
    ['1 John 4 8', '1 John 4:8'],
    ['约 3 16', '约 3:16'],
    ['John 3:16', 'John 3:16'],
    ['psalm 23', 'psalm 23'],
    ['love one another', 'love one another'],
  ])('normalizeSpacedReference(%s) = %s', (q, expected) => {
    expect(normalizeSpacedReference(q)).toBe(expected);
  });

  it('clamps queries to MAX_QUERY_LENGTH code points', () => {
    expect(Array.from(clampQuery('爱'.repeat(600)))).toHaveLength(MAX_QUERY_LENGTH);
    expect(clampQuery('love')).toBe('love');
  });

  it('englishRelevance prefers whole-word, focused verses', () => {
    const short = englishRelevance('love', 'He who doesn’t love doesn’t know God, for God is love.');
    const long = englishRelevance(
      'love',
      'One who has my commandments and keeps them, that person is one who loves me. One who loves me will be loved by my Father, and I will love him, and will reveal myself to him.',
    );
    const stemOnly = englishRelevance('love', 'Beloved, let us love one another');
    expect(short).toBeGreaterThan(long);
    expect(englishRelevance('love', 'my beloved son')).toBe(0);
    expect(stemOnly).toBeGreaterThan(0);
  });

  it('requires all bigrams once a phrase hit exists', () => {
    const results = [r('a', '人要称他的名为以马内利'), r('b', '以法莲必被打碎'), r('c', '与以马内利同在')];
    expect(requireAllBigramsWhenPhraseHits(results, '以马内利').map((x) => x.id)).toEqual(['a', 'c']);
    // No phrase hit → leave results alone.
    expect(requireAllBigramsWhenPhraseHits([r('b', '以法莲必被打碎')], '以马内利')).toHaveLength(1);
  });
});
