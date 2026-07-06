import { describe, expect, it } from 'vitest';
import {
  canShareVerseCount,
  nextStarterBatchIndex,
  parseSavedVerseId,
  sortSavedVerses,
  toggleSelection,
} from '../components/home/reviewHomeHelpers';
import type { Book, Verse } from '../types/verse';

const books: Book[] = [
  book('创世记', 1, 'old'),
  book('诗篇', 19, 'old'),
  book('约翰福音', 43, 'new'),
  book('罗马书', 45, 'new'),
];

const verses: Verse[] = [
  verse('罗马书-8-28', '罗马书', 8, 28),
  verse('约翰福音-3-16', '约翰福音', 3, 16),
  verse('诗篇-23-1', '诗篇', 23, 1),
];

describe('Review Home helpers', () => {
  it('parses existing favorite ids without migration', () => {
    expect(parseSavedVerseId('约翰福音-3-16')).toEqual({ bookKey: '约翰福音', chapter: 3, verse: 16 });
  });

  it('sorts saved verses by Bible order', () => {
    expect(sortSavedVerses(verses, books, 'bible').map((item) => item.id)).toEqual([
      '诗篇-23-1',
      '约翰福音-3-16',
      '罗马书-8-28',
    ]);
  });

  it('random sort is deterministic per seed and changes with seed', () => {
    const first = sortSavedVerses(verses, books, 'random', 1).map((item) => item.id);
    expect(sortSavedVerses(verses, books, 'random', 1).map((item) => item.id)).toEqual(first);
    expect(sortSavedVerses(verses, books, 'random', 10).map((item) => item.id)).not.toEqual(first);
  });

  it('toggles selected share state and clears by caller cancel', () => {
    expect(toggleSelection([], '诗篇-23-1')).toEqual(['诗篇-23-1']);
    expect(toggleSelection(['诗篇-23-1'], '诗篇-23-1')).toEqual([]);
  });

  it('keeps the conservative 200 verse share guard', () => {
    expect(canShareVerseCount(0)).toBe(false);
    expect(canShareVerseCount(200)).toBe(true);
    expect(canShareVerseCount(201)).toBe(false);
  });

  it('cycles starter suggestions for 换一批', () => {
    expect(nextStarterBatchIndex(0, 3)).toBe(1);
    expect(nextStarterBatchIndex(2, 3)).toBe(0);
  });
});

function book(key: string, order: number, testament: Book['testament']): Book {
  return {
    key,
    id: key,
    name: key,
    nameSimplified: key,
    nameTraditional: key,
    nameEnglish: key,
    chapters: 1,
    order,
    testament,
  };
}

function verse(id: string, bookKey: string, chapter: number, verseNumber: number): Verse {
  return {
    id,
    book: bookKey,
    bookKey,
    chapter,
    verse: verseNumber,
    text: `${bookKey} text`,
    testament: books.find((item) => item.key === bookKey)?.testament ?? 'old',
  };
}
