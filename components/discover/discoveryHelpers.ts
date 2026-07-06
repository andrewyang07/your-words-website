import type { SearchResult } from '@/types/search';
import type { Book, Verse } from '@/types/verse';

export type DiscoveryMode = 'curated' | 'search' | 'browse';

export function searchResultToVerse(result: SearchResult): Verse {
  return {
    id: result.id,
    book: result.bookKey,
    bookKey: result.bookKey,
    chapter: result.chapter,
    verse: result.verse,
    text: result.textChinese,
    testament: getTestamentFromBookKey(result.bookKey),
  };
}

export function getChapterOptions(book: Book | null): number[] {
  if (!book || book.chapters < 1) return [];
  return Array.from({ length: book.chapters }, (_, index) => index + 1);
}

export function getVerseReference(verse: Pick<Verse, 'book' | 'chapter' | 'verse'>): string {
  return `${verse.book} ${verse.chapter}:${verse.verse}`;
}

export function buildSingleVerseShareText(verse: Verse): string {
  return `${getVerseReference(verse)} ${verse.text}`;
}

function getTestamentFromBookKey(bookKey: string): Verse['testament'] {
  const newTestamentStart = '马太福音';
  const newTestamentBooks = [
    newTestamentStart,
    '马可福音',
    '路加福音',
    '约翰福音',
    '使徒行传',
    '罗马书',
    '哥林多前书',
    '哥林多后书',
    '加拉太书',
    '以弗所书',
    '腓立比书',
    '歌罗西书',
    '帖撒罗尼迦前书',
    '帖撒罗尼迦后书',
    '提摩太前书',
    '提摩太后书',
    '提多书',
    '腓利门书',
    '希伯来书',
    '雅各书',
    '彼得前书',
    '彼得后书',
    '约翰一书',
    '约翰二书',
    '约翰三书',
    '犹大书',
    '启示录',
  ];

  return newTestamentBooks.includes(bookKey) ? 'new' : 'old';
}
