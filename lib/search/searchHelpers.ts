import type { SearchResult } from '@/types/search';

export const DEFAULT_SEARCH_LIMIT = 50;

/** Longest query we search; longer input is truncated (inputs also set maxLength). */
export const MAX_QUERY_LENGTH = 100;

export function clampQuery(query: string): string {
  return Array.from(query).slice(0, MAX_QUERY_LENGTH).join('');
}

/**
 * "Jn 3 16" / "约 3 16" / "John 3 16" → "Jn 3:16": a book name followed by two space-separated numbers is a
 * chapter:verse reference. Anything else is returned unchanged.
 */
export function normalizeSpacedReference(query: string): string {
  const match = /^(\d?\s*[A-Za-z\u3400-\u9fff][A-Za-z\u3400-\u9fff.\s]*?)\s+(\d{1,3})\s+(\d{1,3})$/.exec(query.trim());
  if (!match) return query;
  return `${match[1]!.trim()} ${match[2]}:${match[3]}`;
}

/** CJK Unified Ideographs + Extension A (same range as pagefindClient). */
export function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

/**
 * Prefer corpus language from the query script.
 * CJK → Chinese; non-empty Latin-only → English (clears a prior zh after CJK search).
 * Empty queries return null so callers keep navigator/persisted lang.
 */
export function detectSearchLangFromQuery(query: string): 'zh' | 'en' | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return hasCjk(trimmed) ? 'zh' : 'en';
}

export function formatResultCount(count: number, options: { truncated?: boolean; traditional?: boolean } = {}): string {
  const { truncated = false, traditional = false } = options;
  const n = truncated && count > 0 ? `${count}+` : String(count);
  return traditional ? `找到 ${n} 條結果` : `找到 ${n} 条结果`;
}

/** Exact-phrase boost used by Pagefind result ranking (homepage + /search). */
export function phraseScore(query: string, result: SearchResult): number {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
  const normalizedWithSpaces = query.toLowerCase().trim();
  const haystacks = [result.bookTraditional, result.bookEnglish, result.textChinese, result.textEnglish].map((value) =>
    value.toLowerCase(),
  );

  let boost = 0;
  if (haystacks.some((value) => value.includes(normalizedWithSpaces))) boost += 100_000;
  if (normalizedQuery.length > 1 && haystacks.some((value) => value.replace(/\s+/g, '').includes(normalizedQuery))) {
    boost += 80_000;
  }

  return boost + result.score;
}

/**
 * Re-rank results by the best phraseScore across query variants
 * (e.g. original + OpenCC traditional/simplified). Pure helper for tests /
 * MiniSearch fallback paths that lack Pagefind.
 */
export function rankByPhraseVariants(results: SearchResult[], queryVariants: string[]): SearchResult[] {
  const variants = queryVariants.map((q) => q.trim()).filter(Boolean);
  if (variants.length === 0) return [...results].sort((a, b) => b.score - a.score);

  return results
    .map((result) => {
      const base = { ...result, score: result.score };
      let best = result.score;
      for (const variant of variants) {
        best = Math.max(best, phraseScore(variant, base));
      }
      return { ...result, score: best };
    })
    .sort((a, b) => b.score - a.score);
}

export type SearchResponse = {
  results: SearchResult[];
  truncated: boolean;
  /** Pinyin results were cut to the first fragments; call to load the full merged list ("more"). */
  loadMore?: () => Promise<SearchResponse>;
};

/**
 * Terms so frequent that a Pagefind word search for them scores 14k–25k pages and takes 1–2.5 s (的 2.2 s, the
 * 1.8 s, of 1.2 s). The word sub-search drops them when other terms remain (pagefindClient dropStopTerms).
 */
export const HEAVY_CJK = /的/g;
export const HEAVY_WORDS = new Set(['the', 'and', 'of', 'to', 'i']);

/** The query is made only of heavy stop terms (的, 的的, the, "of the"), so search returns nothing for it. */
export function isOnlyStopTerms(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  if (hasCjk(q)) return q.replace(HEAVY_CJK, '').replace(/[\s\p{P}]/gu, '') === '';
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => HEAVY_WORDS.has(w));
}

/** Hint for an empty result caused by a stop-term-only query (Latin query → English). */
export function moreWordsHint(query: string, traditional: boolean): string {
  if (!hasCjk(query)) return 'Please type a few more words';
  return traditional ? '請多輸入幾個字' : '请多输入几个字';
}
