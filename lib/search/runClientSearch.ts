import { getSearchEngine } from './searchEngine';
import { DEFAULT_SEARCH_LIMIT, type SearchResponse } from './searchHelpers';

/**
 * Homepage-parity search for /search: try Pagefind first (OpenCC + phraseScore),
 * fall back to MiniSearch when Pagefind is unavailable.
 *
 * Verse references ("约翰福音 3:16", "John 3:16", ranges) are parsed before Pagefind so the
 * exact verse(s) rank first, followed by the normal full-text results.
 */
export type RunClientSearchOptions = {
  /** Called when Pagefind failed and the MiniSearch fallback must first download/index the Bible. */
  onFallbackLoading?: () => void;
};

export async function runClientSearch(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
  options: RunClientSearchOptions = {},
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], truncated: false };

  try {
    const pagefindClient = await import('./pagefindClient');
    const { searchWithPagefind } = pagefindClient;
    const chapterRef = await resolveChapterReference(trimmed);
    if (chapterRef) {
      // Chapter-only reference: that chapter's verses in order, then normal full-text results.
      const [chapterVerses, response] = await Promise.all([
        pagefindClient.searchChapterWithPagefind(chapterRef.bookOrder, chapterRef.chapter),
        searchWithPagefind(trimmed, limit),
      ]);
      if (chapterVerses.length > 0) {
        const ids = new Set(chapterVerses.map((r) => r.id));
        const merged = [...chapterVerses, ...response.results.filter((r) => !ids.has(r.id))];
        return { results: merged.slice(0, limit), truncated: merged.length > limit || response.truncated };
      }
      return response;
    }
    const refPromise = resolveReference(trimmed);
    const response = await searchWithPagefind(trimmed, limit);
    const ref = await refPromise;
    if (!ref) return response;

    const { promoteReference, loadVersesFromCorpus } = await import('./referenceFirst');
    const results = await promoteReference(response.results, ref, limit, loadVersesFromCorpus);
    return { results, truncated: response.truncated };
  } catch {
    const engine = getSearchEngine();
    if (!engine.initialized) {
      options.onFallbackLoading?.();
      await engine.initialize();
    }
    return engine.searchWithMeta(trimmed, limit);
  }
}

async function resolveChapterReference(query: string) {
  if (!/\d$/.test(query) || /[:：.]/.test(query)) return null;
  try {
    const { parseChapterReference, loadBooks } = await import('./referenceFirst');
    return parseChapterReference(query, await loadBooks());
  } catch {
    return null;
  }
}

async function resolveReference(query: string) {
  // Cheap gate: only queries with "chapter:verse" can be verse references.
  if (!/\d\s*[:：.]\s*\d/.test(query)) return null;
  try {
    const { parseVerseReference, loadBooks } = await import('./referenceFirst');
    const books = await loadBooks();
    return parseVerseReference(
      query,
      books.map((b) => ({ key: b.key, nameEnglish: b.nameEnglish })),
    );
  } catch {
    return null;
  }
}
