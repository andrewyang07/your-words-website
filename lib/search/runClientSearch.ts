import { getSearchEngine } from './searchEngine';
import { DEFAULT_SEARCH_LIMIT, type SearchResponse } from './searchHelpers';

/**
 * Homepage-parity search for /search: try Pagefind first (OpenCC + phraseScore),
 * fall back to MiniSearch when Pagefind is unavailable.
 *
 * Verse references ("约翰福音 3:16", "John 3:16", ranges) are parsed before Pagefind so the
 * exact verse(s) rank first, followed by the normal full-text results.
 */
export async function runClientSearch(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], truncated: false };

  try {
    const { searchWithPagefind } = await import('./pagefindClient');
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
      await engine.initialize();
    }
    return engine.searchWithMeta(trimmed, limit);
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
      books.map((b) => ({ key: b.key, nameEnglish: b.nameEnglish }))
    );
  } catch {
    return null;
  }
}
