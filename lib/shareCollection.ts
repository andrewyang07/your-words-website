import { bookKeyToId, encodeVerseList, parseVerseId } from './bibleBookMapping';
import { MAX_SHARED_VERSES } from './constants';
import { buildShareUrl } from './shareUtils.mjs';

type ClipboardWriter = Pick<Clipboard, 'writeText'>;

interface ShareSavedVerseCollectionArgs {
  verseIds: string[];
  origin: string;
  clipboard?: ClipboardWriter;
}

export type ShareSavedVerseCollectionResult = {
  status: 'copied';
  url: string;
  count: number;
} | {
  status: 'too-many';
  count: number;
  max: typeof MAX_SHARED_VERSES;
} | {
  status: 'manual-copy';
  url: string;
  count: number;
};

function getCanonicalSharedVerses(verseIds: string[]) {
  return [...new Set(verseIds)]
    .map(parseVerseId)
    .filter((verse): verse is NonNullable<typeof verse> => verse !== null && Boolean(bookKeyToId[verse.bookKey]))
    .sort((left, right) =>
      bookKeyToId[left.bookKey] - bookKeyToId[right.bookKey]
      || left.chapter - right.chapter
      || left.verse - right.verse
    );
}

export async function shareSavedVerseCollection({
  verseIds,
  origin,
  clipboard,
}: ShareSavedVerseCollectionArgs): Promise<ShareSavedVerseCollectionResult> {
  const verses = getCanonicalSharedVerses(verseIds);

  if (verses.length > MAX_SHARED_VERSES) {
    return { status: 'too-many', count: verses.length, max: MAX_SHARED_VERSES };
  }

  const encoded = encodeVerseList(verses);
  const url = buildShareUrl({ origin, encoded });

  if (!clipboard) {
    return { status: 'manual-copy', url, count: verses.length };
  }

  try {
    await clipboard.writeText(url);
  } catch {
    return { status: 'manual-copy', url, count: verses.length };
  }

  return { status: 'copied', url, count: verses.length };
}
