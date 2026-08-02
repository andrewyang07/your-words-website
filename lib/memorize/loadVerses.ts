import { loadChapterVerses } from '@/lib/dataLoader';
import { parseVerseId } from '@/lib/bibleBookMapping';
import type { Verse } from '@/types/verse';

export async function loadCuvVersesById(ids: string[]): Promise<Verse[]> {
  const requested = ids.map(parseVerseId).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const groups = new Map<string, Set<number>>();
  requested.forEach(({ bookKey, chapter, verse }) => {
    const key = `${bookKey}\u0000${chapter}`;
    const verses = groups.get(key) ?? new Set<number>();
    verses.add(verse);
    groups.set(key, verses);
  });

  const loaded = new Map<string, Verse>();
  for (const [key, verseNumbers] of groups) {
    const [bookKey, chapterText] = key.split('\u0000');
    const verses = await loadChapterVerses(bookKey, Number(chapterText), 'simplified');
    verses.filter((verse) => verseNumbers.has(verse.verse)).forEach((verse) => loaded.set(verse.id, verse));
  }

  return ids.map((id) => loaded.get(id)).filter((verse): verse is Verse => Boolean(verse));
}
