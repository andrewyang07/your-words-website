import { describe, expect, it } from 'vitest';
import { buildSingleVerseShareText, getChapterOptions, getVerseReference, searchResultToVerse } from '../components/discover/discoveryHelpers';
import type { Book, Verse } from '../types/verse';

describe('discovery helpers', () => {
  it('keeps curated cards full-text ready', () => {
    const verse: Verse = {
      id: '约翰福音-3-16',
      book: '约翰福音',
      bookKey: '约翰福音',
      chapter: 3,
      verse: 16,
      text: '神爱世人，甚至将他的独生子赐给他们。',
      testament: 'new',
    };

    expect(getVerseReference(verse)).toBe('约翰福音 3:16');
    expect(buildSingleVerseShareText(verse)).toContain(verse.text);
  });

  it('maps search results to saveable verses', () => {
    const verse = searchResultToVerse({
      id: '罗马书-8-28',
      bookKey: '罗马书',
      bookTraditional: '羅馬書',
      bookEnglish: 'Romans',
      chapter: 8,
      verse: 28,
      textChinese: '万事都互相效力，叫爱神的人得益处。',
      textEnglish: 'We know that all things work together for good...',
      score: 100,
      matchType: 'reference',
    });

    expect(verse).toMatchObject({
      id: '罗马书-8-28',
      book: '罗马书',
      bookKey: '罗马书',
      chapter: 8,
      verse: 28,
      text: '万事都互相效力，叫爱神的人得益处。',
      testament: 'new',
    });
  });

  it('builds chapter browse options', () => {
    const book = {
      key: '诗篇',
      name: '诗篇',
      nameTraditional: '詩篇',
      nameSimplified: '诗篇',
      nameEnglish: 'Psalms',
      testament: 'old',
      chapters: 3,
      order: 19,
    } satisfies Book;

    expect(getChapterOptions(book)).toEqual([1, 2, 3]);
    expect(getChapterOptions(null)).toEqual([]);
  });
});
