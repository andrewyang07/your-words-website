import type { BookMapping, SearchResult } from '@/types/search';
import { parseReference } from './referenceParser';

export type VerseReference = {
  bookKey: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

type BookRecord = {
  key: string;
  nameTraditional?: string;
  nameEnglish: string;
};

const RANGE_RE = /^(.*?\d{1,3}\s*[:：.]\s*)(\d{1,3})\s*[-–—~～至到]\s*(\d{1,3})$/;
const MAX_RANGE = 30;

/**
 * Parse a verse-level reference ("约翰福音 3:16", "約翰福音 3:16", "约3:16",
 * "John 3:16", "Jn 3:16", "罗 8:28-30"). Book-only / chapter-only queries return null
 * so they keep the normal full-text behaviour.
 */
export function parseVerseReference(
  query: string,
  bookMappings: BookMapping[]
): VerseReference | null {
  const trimmed = query.trim();
  if (!/\d\s*[:：.]\s*\d/.test(trimmed)) return null;

  let base = trimmed;
  let rangeEnd: number | undefined;
  const range = RANGE_RE.exec(trimmed);
  if (range?.[1] && range[2] && range[3]) {
    base = `${range[1]}${range[2]}`;
    rangeEnd = Number(range[3]);
  }

  const ref = parseReference(base, bookMappings);
  if (!ref?.bookChinese || !ref.chapter || !ref.verse) return null;

  const verseStart = ref.verse;
  const verseEnd =
    rangeEnd && rangeEnd >= verseStart ? Math.min(rangeEnd, verseStart + MAX_RANGE - 1) : verseStart;
  return { bookKey: ref.bookChinese, chapter: ref.chapter, verseStart, verseEnd };
}

function inRef(result: SearchResult, ref: VerseReference): boolean {
  return (
    result.bookKey === ref.bookKey &&
    result.chapter === ref.chapter &&
    result.verse >= ref.verseStart &&
    result.verse <= ref.verseEnd
  );
}

/**
 * Put the referenced verse(s) first (in verse order), then the remaining full-text results.
 * `loadVerses` supplies referenced verses missing from `results` (may return fewer/none).
 */
export async function promoteReference(
  results: SearchResult[],
  ref: VerseReference,
  limit: number,
  loadVerses: (ref: VerseReference, missing: number[]) => Promise<SearchResult[]>
): Promise<SearchResult[]> {
  const hits = new Map<number, SearchResult>();
  for (const r of results) if (inRef(r, ref)) hits.set(r.verse, r);

  const missing: number[] = [];
  for (let v = ref.verseStart; v <= ref.verseEnd; v += 1) if (!hits.has(v)) missing.push(v);
  if (missing.length > 0) {
    try {
      for (const r of await loadVerses(ref, missing)) if (inRef(r, ref)) hits.set(r.verse, r);
    } catch {
      // Keep whatever Pagefind returned.
    }
  }

  const top = [...hits.values()]
    .sort((a, b) => a.verse - b.verse)
    .map((r) => ({ ...r, matchType: 'reference' as const }));
  const rest = results.filter((r) => !inRef(r, ref));
  return [...top, ...rest].slice(0, limit);
}

let booksPromise: Promise<BookRecord[]> | null = null;

export function loadBooks(): Promise<BookRecord[]> {
  if (!booksPromise) {
    booksPromise = import('@/lib/bibleDataCache')
      .then(({ fetchWithCache }) => fetchWithCache('/data/books.json'))
      .then((data) => (data as { books: BookRecord[] }).books)
      .catch((error: unknown) => {
        booksPromise = null;
        throw error;
      });
  }
  return booksPromise;
}

/** Fallback for a referenced verse Pagefind did not return: read it from the (cached) corpus. */
export async function loadVersesFromCorpus(
  ref: VerseReference,
  missing: number[]
): Promise<SearchResult[]> {
  const [{ fetchWithCache }, books] = await Promise.all([import('@/lib/bibleDataCache'), loadBooks()]);
  const bible = (await fetchWithCache('/data/CUV_bible.json')) as Record<
    string,
    Record<string, Record<string, string>> | undefined
  >;
  const chapter = bible[ref.bookKey]?.[String(ref.chapter)];
  if (!chapter) return [];
  const book = books.find((b) => b.key === ref.bookKey);
  return missing.flatMap((verse) => {
    const textChinese = chapter[String(verse)];
    if (!textChinese) return [];
    return [
      {
        id: `${ref.bookKey}-${ref.chapter}-${verse}`,
        bookKey: ref.bookKey,
        bookTraditional: book?.nameTraditional ?? ref.bookKey,
        bookEnglish: book?.nameEnglish ?? '',
        chapter: ref.chapter,
        verse,
        textChinese,
        textEnglish: '',
        score: 100,
        matchType: 'reference' as const,
      },
    ];
  });
}
