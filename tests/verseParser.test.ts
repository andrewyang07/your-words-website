import { describe, expect, it } from 'vitest';
import { parseVerseReferences } from '../lib/verseParser';

describe('parseVerseReferences', () => {
  it('keeps app shorthand references working for Chinese notebook notes', () => {
    const refs = parseVerseReferences('今天默想 @约3:16，也看约翰福音3:17');

    expect(refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 16 }),
        expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 17 }),
      ])
    );
  });

  it('supports Traditional Chinese shorthand and verse ranges', () => {
    const refs = parseVerseReferences('今天讀 @約3:16-18 和 約翰福音3:19');

    expect(refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 16, endVerse: 18 }),
        expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 19 }),
      ])
    );
  });

  it('accepts devotional punctuation around Chinese verse ranges', () => {
    const refs = parseVerseReferences('默想：约 3：16 ～ 18；再看 約 3:19–21');

    expect(refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 16, endVerse: 18 }),
        expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 19, endVerse: 21 }),
      ])
    );
  });

  it('keeps English references through the OSS parser', () => {
    const refs = parseVerseReferences('Grace appears clearly in John 3:17.');

    expect(refs).toEqual([
      expect.objectContaining({ book: '约翰福音', chapter: 3, startVerse: 17 }),
    ]);
  });

  it('rejects external parser matches that span notebook paragraphs', () => {
    const refs = parseVerseReferences('今天的灵修\n\n@约3:16\n\nJohn 3:17');

    expect(refs.some((ref) => ref.original.includes('\n'))).toBe(false);
  });
});
