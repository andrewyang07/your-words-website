import type { SearchResult } from '@/types/search';

export const DEFAULT_SEARCH_LIMIT = 50;

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

export function formatResultCount(
  count: number,
  options: { truncated?: boolean; traditional?: boolean } = {}
): string {
  const { truncated = false, traditional = false } = options;
  const n = truncated && count > 0 ? `${count}+` : String(count);
  return traditional ? `找到 ${n} 條結果` : `找到 ${n} 条结果`;
}

/** Exact-phrase boost used by Pagefind result ranking (homepage + /search). */
export function phraseScore(query: string, result: SearchResult): number {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
  const normalizedWithSpaces = query.toLowerCase().trim();
  const haystacks = [
    result.bookTraditional,
    result.bookEnglish,
    result.textChinese,
    result.textEnglish,
  ].map((value) => value.toLowerCase());

  let boost = 0;
  if (haystacks.some((value) => value.includes(normalizedWithSpaces))) boost += 100_000;
  if (
    normalizedQuery.length > 1 &&
    haystacks.some((value) => value.replace(/\s+/g, '').includes(normalizedQuery))
  ) {
    boost += 80_000;
  }

  return boost + result.score;
}

/**
 * Re-rank results by the best phraseScore across query variants
 * (e.g. original + OpenCC traditional/simplified). Pure helper for tests /
 * MiniSearch fallback paths that lack Pagefind.
 */
export function rankByPhraseVariants(
  results: SearchResult[],
  queryVariants: string[]
): SearchResult[] {
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
};
