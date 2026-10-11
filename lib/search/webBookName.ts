/** books.json English names that differ from the keys in public/data/WEB_bible.json. */
const WEB_BOOK_ALIASES: Record<string, string> = { Psalms: 'Psalm', 'Song of Solomon': 'Song Of Solomon' };

/** Key of a book in WEB_bible.json for a books.json `nameEnglish`. */
export function webBookName(nameEnglish: string): string {
  return WEB_BOOK_ALIASES[nameEnglish] ?? nameEnglish;
}
