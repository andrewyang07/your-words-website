import { getSearchEngine } from './searchEngine';
import {
  DEFAULT_SEARCH_LIMIT,
  type SearchResponse,
} from './searchHelpers';

/**
 * Homepage-parity search for /search: try Pagefind first (OpenCC + phraseScore),
 * fall back to MiniSearch when Pagefind is unavailable.
 */
export async function runClientSearch(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], truncated: false };

  try {
    const { searchWithPagefind } = await import('./pagefindClient');
    return await searchWithPagefind(trimmed, limit);
  } catch {
    const engine = getSearchEngine();
    if (!engine.initialized) {
      await engine.initialize();
    }
    return engine.searchWithMeta(trimmed, limit);
  }
}
