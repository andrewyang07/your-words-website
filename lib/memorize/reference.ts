import booksData from '@/public/data/books.json';
import type { Language } from '@/types/verse';

export function verseReference(verse: { bookKey: string; book?: string; chapter: number; verse: number }, language: Language) {
  const book = booksData.books.find((candidate) => candidate.key === verse.bookKey);
  const name = book ? (language === 'traditional' ? book.nameTraditional : book.nameSimplified) : (verse.book ?? verse.bookKey);
  return `${name} ${verse.chapter}:${verse.verse}`;
}
