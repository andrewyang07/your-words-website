/**
 * Bilingual Bible reference parser
 * Supports both Chinese and English book references
 */

import { getStandardBookName } from '@/lib/verseParser';
import type { BookMapping } from '@/types/search';

// English abbreviation map → full English name
const ENGLISH_ABBREVIATIONS: Record<string, string> = {
  // Old Testament
  'gen': 'Genesis', 'ge': 'Genesis', 'gn': 'Genesis',
  'exo': 'Exodus', 'ex': 'Exodus',
  'lev': 'Leviticus', 'le': 'Leviticus', 'lv': 'Leviticus',
  'num': 'Numbers', 'nu': 'Numbers', 'nm': 'Numbers',
  'deu': 'Deuteronomy', 'deut': 'Deuteronomy', 'dt': 'Deuteronomy',
  'jos': 'Joshua', 'josh': 'Joshua',
  'jdg': 'Judges', 'judg': 'Judges',
  'rut': 'Ruth', 'ru': 'Ruth',
  '1sa': '1 Samuel', '1sam': '1 Samuel', '1 sam': '1 Samuel',
  '2sa': '2 Samuel', '2sam': '2 Samuel', '2 sam': '2 Samuel',
  '1ki': '1 Kings', '1kgs': '1 Kings', '1 kings': '1 Kings',
  '2ki': '2 Kings', '2kgs': '2 Kings', '2 kings': '2 Kings',
  '1ch': '1 Chronicles', '1chr': '1 Chronicles', '1 chr': '1 Chronicles', '1 chronicles': '1 Chronicles',
  '2ch': '2 Chronicles', '2chr': '2 Chronicles', '2 chr': '2 Chronicles', '2 chronicles': '2 Chronicles',
  'ezr': 'Ezra',
  'neh': 'Nehemiah', 'ne': 'Nehemiah',
  'est': 'Esther', 'esth': 'Esther',
  'job': 'Job', 'jb': 'Job',
  'psa': 'Psalms', 'ps': 'Psalms', 'psalm': 'Psalms',
  'pro': 'Proverbs', 'prov': 'Proverbs', 'pr': 'Proverbs',
  'ecc': 'Ecclesiastes', 'eccl': 'Ecclesiastes',
  'sol': 'Song of Solomon', 'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'sg': 'Song of Solomon',
  'isa': 'Isaiah', 'is': 'Isaiah',
  'jer': 'Jeremiah', 'je': 'Jeremiah',
  'lam': 'Lamentations', 'la': 'Lamentations',
  'eze': 'Ezekiel', 'ezek': 'Ezekiel',
  'dan': 'Daniel', 'da': 'Daniel', 'dn': 'Daniel',
  'hos': 'Hosea', 'ho': 'Hosea',
  'joe': 'Joel', 'jl': 'Joel',
  'amo': 'Amos', 'am': 'Amos',
  'oba': 'Obadiah', 'ob': 'Obadiah',
  'jon': 'Jonah', 'jnh': 'Jonah',
  'mic': 'Micah', 'mi': 'Micah',
  'nah': 'Nahum', 'na': 'Nahum',
  'hab': 'Habakkuk',
  'zep': 'Zephaniah', 'zeph': 'Zephaniah',
  'hag': 'Haggai', 'hg': 'Haggai',
  'zec': 'Zechariah', 'zech': 'Zechariah',
  'mal': 'Malachi',
  // New Testament
  'mat': 'Matthew', 'matt': 'Matthew', 'mt': 'Matthew',
  'mar': 'Mark', 'mk': 'Mark', 'mrk': 'Mark',
  'luk': 'Luke', 'lk': 'Luke',
  'joh': 'John', 'jn': 'John',
  'act': 'Acts', 'ac': 'Acts',
  'rom': 'Romans', 'ro': 'Romans',
  '1co': '1 Corinthians', '1cor': '1 Corinthians', '1 cor': '1 Corinthians', '1 corinthians': '1 Corinthians',
  '2co': '2 Corinthians', '2cor': '2 Corinthians', '2 cor': '2 Corinthians', '2 corinthians': '2 Corinthians',
  'gal': 'Galatians', 'ga': 'Galatians',
  'eph': 'Ephesians',
  'phi': 'Philippians', 'phil': 'Philippians', 'php': 'Philippians',
  'col': 'Colossians',
  '1th': '1 Thessalonians', '1thes': '1 Thessalonians', '1 thes': '1 Thessalonians', '1 thessalonians': '1 Thessalonians',
  '2th': '2 Thessalonians', '2thes': '2 Thessalonians', '2 thes': '2 Thessalonians', '2 thessalonians': '2 Thessalonians',
  '1ti': '1 Timothy', '1tim': '1 Timothy', '1 tim': '1 Timothy', '1 timothy': '1 Timothy',
  '2ti': '2 Timothy', '2tim': '2 Timothy', '2 tim': '2 Timothy', '2 timothy': '2 Timothy',
  'tit': 'Titus',
  'phm': 'Philemon', 'philem': 'Philemon',
  'heb': 'Hebrews',
  'jam': 'James', 'jas': 'James',
  '1pe': '1 Peter', '1pet': '1 Peter', '1 pet': '1 Peter', '1 peter': '1 Peter',
  '2pe': '2 Peter', '2pet': '2 Peter', '2 pet': '2 Peter', '2 peter': '2 Peter',
  '1jo': '1 John', '1jn': '1 John', '1 john': '1 John',
  '2jo': '2 John', '2jn': '2 John', '2 john': '2 John',
  '3jo': '3 John', '3jn': '3 John', '3 john': '3 John',
  'jud': 'Jude',
  'rev': 'Revelation', 're': 'Revelation',
};

// Full English names (lowercase → proper case)
const ENGLISH_FULL_NAMES: Record<string, string> = {
  'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus',
  'numbers': 'Numbers', 'deuteronomy': 'Deuteronomy', 'joshua': 'Joshua',
  'judges': 'Judges', 'ruth': 'Ruth', '1 samuel': '1 Samuel', '2 samuel': '2 Samuel',
  '1 kings': '1 Kings', '2 kings': '2 Kings', '1 chronicles': '1 Chronicles',
  '2 chronicles': '2 Chronicles', 'ezra': 'Ezra', 'nehemiah': 'Nehemiah',
  'esther': 'Esther', 'job': 'Job', 'psalms': 'Psalms', 'proverbs': 'Proverbs',
  'ecclesiastes': 'Ecclesiastes', 'song of solomon': 'Song of Solomon',
  'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah', 'lamentations': 'Lamentations',
  'ezekiel': 'Ezekiel', 'daniel': 'Daniel', 'hosea': 'Hosea', 'joel': 'Joel',
  'amos': 'Amos', 'obadiah': 'Obadiah', 'jonah': 'Jonah', 'micah': 'Micah',
  'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah',
  'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi',
  'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John',
  'acts': 'Acts', 'romans': 'Romans', '1 corinthians': '1 Corinthians',
  '2 corinthians': '2 Corinthians', 'galatians': 'Galatians', 'ephesians': 'Ephesians',
  'philippians': 'Philippians', 'colossians': 'Colossians',
  '1 thessalonians': '1 Thessalonians', '2 thessalonians': '2 Thessalonians',
  '1 timothy': '1 Timothy', '2 timothy': '2 Timothy', 'titus': 'Titus',
  'philemon': 'Philemon', 'hebrews': 'Hebrews', 'james': 'James',
  '1 peter': '1 Peter', '2 peter': '2 Peter', '1 john': '1 John',
  '2 john': '2 John', '3 john': '3 John', 'jude': 'Jude', 'revelation': 'Revelation',
};

export interface ParsedReference {
  bookChinese: string | null;
  bookEnglish: string | null;
  chapter?: number;
  verse?: number;
}

/**
 * Parse a bilingual Bible reference string.
 * Supports: "John 3:16", "约3:16", "创1:1", "Ps 23", "Rom 8:28", "Genesis", etc.
 */
export function parseReference(
  query: string,
  bookMappings: BookMapping[]
): ParsedReference | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Try Chinese reference first
  const chineseResult = tryChineseReference(trimmed, bookMappings);
  if (chineseResult) return chineseResult;

  // Try English reference
  const englishResult = tryEnglishReference(trimmed, bookMappings);
  if (englishResult) return englishResult;

  return null;
}

function tryChineseReference(
  query: string,
  bookMappings: BookMapping[]
): ParsedReference | null {
  // Match: bookName [chapter[:verse]]
  const match = query.match(
    /^(.+?)\s*(\d{1,3})?\s*[:：]\s*(\d{1,3})?$|^(.+?)\s*(\d{1,3})$|^(.+)$/
  );
  if (!match) return null;

  let bookPart: string;
  let chapter: number | undefined;
  let verse: number | undefined;

  if (match[1]) {
    // Format: book chapter:verse or book chapter:
    bookPart = match[1];
    chapter = match[2] ? parseInt(match[2], 10) : undefined;
    verse = match[3] ? parseInt(match[3], 10) : undefined;
  } else if (match[4]) {
    // Format: book chapter
    bookPart = match[4];
    chapter = parseInt(match[5], 10);
  } else {
    // Format: book only
    bookPart = match[6];
  }

  const standardName = getStandardBookName(bookPart);
  if (!standardName) return null;

  // Find English name from mappings
  const mapping = bookMappings.find((m) => m.key === standardName);
  const bookEnglish = mapping?.nameEnglish || null;

  return { bookChinese: standardName, bookEnglish, chapter, verse };
}

function tryEnglishReference(
  query: string,
  bookMappings: BookMapping[]
): ParsedReference | null {
  // Handle numbered books: "1 John 3:16", "2 Sam 7"
  const match = query.match(
    /^(\d?\s*[a-zA-Z][a-zA-Z\s]*?)\s*(\d{1,3})?\s*[:.]?\s*(\d{1,3})?$/
  );
  if (!match) return null;

  const bookPart = match[1].trim().toLowerCase();
  const chapter = match[2] ? parseInt(match[2], 10) : undefined;
  const verse = match[3] ? parseInt(match[3], 10) : undefined;

  // Resolve English book name
  let bookEnglish: string | null = null;

  // Check full names first
  if (ENGLISH_FULL_NAMES[bookPart]) {
    bookEnglish = ENGLISH_FULL_NAMES[bookPart];
  }
  // Check abbreviations
  if (!bookEnglish && ENGLISH_ABBREVIATIONS[bookPart]) {
    bookEnglish = ENGLISH_ABBREVIATIONS[bookPart];
  }
  // Partial match on full names
  if (!bookEnglish) {
    for (const [fullLower, proper] of Object.entries(ENGLISH_FULL_NAMES)) {
      if (fullLower.startsWith(bookPart) && bookPart.length >= 3) {
        bookEnglish = proper;
        break;
      }
    }
  }

  if (!bookEnglish) return null;

  // Find Chinese name from mappings
  const mapping = bookMappings.find((m) => m.nameEnglish === bookEnglish);
  const bookChinese = mapping?.key || null;

  return { bookChinese, bookEnglish, chapter, verse };
}
