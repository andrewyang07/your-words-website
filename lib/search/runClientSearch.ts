import { getSearchEngine } from './searchEngine';
import {
  DEFAULT_SEARCH_LIMIT,
  appendNewResults,
  clampQuery,
  normalizeSpacedReference,
  type SearchResponse,
} from './searchHelpers';

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
  /**
   * Two-step pinyin search. When set, the returned response comes from the main index only (English / CJK results
   * are never held up by the pinyin index); if the query could be pinyin, the pinyin index is then loaded in the
   * background and this is called with the merged main + pinyin results. Without it, results include pinyin.
   */
  onPinyinResults?: (response: SearchResponse) => void;
  /** False once a newer query replaced this one: its pinyin search is not started or is abandoned. */
  isCurrent?: () => boolean;
};

/** Main-index hit count at or below which the pinyin index is fetched in parallel with the main results. */
const FEW_MAIN_HITS = 10;
/** Pinyin result fragments loaded for the first screen of a two-step search. */
const PINYIN_FIRST_FRAGMENTS = 10;

export async function runClientSearch(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
  options: RunClientSearchOptions = {},
): Promise<SearchResponse> {
  let trimmed = clampQuery(query).trim();
  if (!trimmed) return { results: [], truncated: false };
  const spaced = normalizeSpacedReference(trimmed);
  if (spaced !== trimmed && (await resolveReference(spaced))) trimmed = spaced;

  // "John 3:16 meaning", "约3:16 神爱世人": a verse reference followed by extra words. The whole string is not a
  // reference (Pagefind ANDs every word → 0 results; the loose parser even read "John 3:16 test" as 3 John 1:6), so
  // show the referenced verse(s) first, then full-text results for the extra words.
  const leading = splitLeadingReference(trimmed);
  if (leading) {
    const ref = await resolveReference(leading.reference);
    if (ref) {
      try {
        const { searchWithPagefind } = await import('./pagefindClient');
        const { promoteReference, loadVersesFromCorpus } = await import('./referenceFirst');
        const rest = await searchWithPagefind(leading.rest, limit, { pinyin: false }).catch(() => ({
          results: [],
          truncated: false,
        }));
        const results = await promoteReference(rest.results, ref, limit, loadVersesFromCorpus);
        if (results.some((r) => r.matchType === 'reference')) return { results, truncated: rest.truncated };
      } catch {
        // fall through to the normal path
      }
    }
  }

  try {
    const pagefindClient = await import('./pagefindClient');
    const { searchWithPagefind } = pagefindClient;
    const chapterRef = await resolveChapterReference(trimmed);
    if (chapterRef) {
      // Chapter-only reference: that chapter's verses in order, then normal full-text results.
      const [chapterVerses, response] = await Promise.all([
        pagefindClient.searchChapterWithPagefind(chapterRef.bookOrder, chapterRef.chapter),
        searchWithPagefind(trimmed, limit, { pinyin: false }),
      ]);
      if (chapterVerses.length > 0) {
        const ids = new Set(chapterVerses.map((r) => r.id));
        const merged = [...chapterVerses, ...response.results.filter((r) => !ids.has(r.id))];
        return { results: merged.slice(0, limit), truncated: merged.length > limit || response.truncated };
      }
      return response;
    }
    const refPromise = resolveReference(trimmed);
    const twoStep = Boolean(options.onPinyinResults);
    const wantsPinyin = twoStep && pagefindClient.couldBePinyin(trimmed);
    let mainDelivered: () => void = () => undefined;
    const delivered = new Promise<void>((resolve) => (mainDelivered = resolve));
    let pinyinStarted = false;
    const startPinyin = () => {
      if (pinyinStarted || !wantsPinyin || options.isCurrent?.() === false) return;
      pinyinStarted = true;
      // First screen: only the top PINYIN_FIRST_FRAGMENTS fragments per pinyin search; the rest via loadMore.
      void searchWithPagefind(trimmed, limit, {
        pinyin: true,
        pinyinTop: PINYIN_FIRST_FRAGMENTS,
        isCurrent: options.isCurrent,
      })
        // Never before the caller has shown the main results (they would overwrite the merged list).
        .then(async (merged) => {
          await delivered;
          // Append-only below the main results already shown (none shown: pinyin list as-is).
          options.onPinyinResults?.(appendNewResults(response.results, merged));
        })
        .catch(() => undefined);
    };
    const response = await searchWithPagefind(trimmed, limit, {
      pinyin: !twoStep,
      // A query superseded while typing stops before fetching its result fragments.
      isCurrent: options.isCurrent,
      // Few main-index hits (sasr, shen ai shi ren): nothing much to download for the main list, so fetch the
      // pinyin index alongside it. Many hits (love): wait until the main results are shown.
      onMainHits: (count) => {
        if (count <= FEW_MAIN_HITS) startPinyin();
      },
    });
    const ref = await refPromise;
    if (!ref) {
      startPinyin();
      // The caller renders the returned results in its continuation; release pinyin results after that.
      setTimeout(mainDelivered, 0);
      return response;
    }
    const { promoteReference, loadVersesFromCorpus } = await import('./referenceFirst');
    const results = await promoteReference(response.results, ref, limit, loadVersesFromCorpus);
    // Exact verse reference: show just the referenced verse(s). Loose full-text matches of "约翰福音 3:16"
    // (other verses mentioning 约翰 / 16) are noise. Fall back to the full list only if the verse was not found.
    const exact = results.filter((r) => r.matchType === 'reference');
    if (exact.length > 0) return { results: exact, truncated: false };
    return { results, truncated: response.truncated };
  } catch (error) {
    // Superseded by a newer query: nothing to show, and not a Pagefind failure (no MiniSearch fallback).
    if (error instanceof Error && error.name === 'StaleSearchError') return { results: [], truncated: false };
    const engine = getSearchEngine();
    if (!engine.initialized) {
      options.onFallbackLoading?.();
      await engine.initialize();
    }
    return engine.searchWithMeta(trimmed, limit);
  }
}

/** Leading "book chapter:verse[-verse]" plus at least one more word, else null. */
export function splitLeadingReference(query: string): { reference: string; rest: string } | null {
  const match = /^(.+?\d{1,3}\s*[:：.]\s*\d{1,3}(?:\s*[-–—~～至到]\s*\d{1,3})?)(?:\s+|(?=[\u3400-\u9fff]))(\S.*)$/.exec(
    query.trim(),
  );
  if (!match?.[1] || !match[2]) return null;
  return { reference: match[1].trim(), rest: match[2].trim() };
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

let preloadPromise: Promise<void> | null = null;

/**
 * Warm everything the first search needs (Pagefind runtime, OpenCC, books.json). Safe to call repeatedly; errors
 * are swallowed (the real search reports them / falls back to MiniSearch).
 */
export function preloadSearch(): Promise<void> {
  preloadPromise ??= Promise.all([
    import('./pagefindClient').then((m) => m.preloadPagefind()),
    import('./referenceFirst').then((m) => m.loadBooks()),
  ])
    .then(() => undefined)
    .catch(() => {
      preloadPromise = null;
    });
  return preloadPromise;
}

/**
 * While the user types: start fetching the pinyin index (search code + part metas) for a pinyin-like query, so the
 * pinyin search after Enter does not start from zero. Call debounced; skipped while a search is loading so it never
 * competes with main-index results.
 */
export function prefetchPinyinFor(query: string): void {
  const trimmed = clampQuery(query).trim();
  if (!trimmed || /[\u3400-\u9fff\d]/.test(trimmed)) return;
  void import('./pagefindClient')
    .then((m) => {
      if (m.couldBePinyin(trimmed)) m.preloadPinyinPagefind(trimmed);
    })
    .catch(() => undefined);
}
