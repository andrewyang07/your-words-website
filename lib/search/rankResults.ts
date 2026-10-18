import type { SearchResult } from '@/types/search';
import { hasCjk, phraseScore } from './searchHelpers';

/**
 * Shared final ranking for both search engines (Pagefind primary, MiniSearch fallback), so the same candidates get
 * the same order whichever engine found them. Each engine only supplies candidates and its own relevance score; that
 * score is reduced to a rank-based tiebreak (0–1000) so the two engines' score scales never matter.
 *
 * Tiers, highest first:
 *   phrase       whole query (any script variant) inside the verse            100_000 / 80_000 (phraseScore)
 *   bigrams      share of the query's CJK bigrams present in the verse         up to 50_000
 *   english      whole-word coverage + density for Latin queries               up to ~50_000
 *   synonym      hook for T7 (query expansion)                                 caller-supplied
 *   popular      hook for T9 (static popularity snapshot)                      caller-supplied
 *   engine rank  the engine's own order                                        0–1000
 */
export type RankContext = {
  /** Original (trimmed) query. */
  query: string;
  /** Simplified-Chinese form of the query (same as query for non-CJK). */
  simplified: string;
  /** Script variants of the query (original, Traditional, Simplified, corrections). */
  variants: string[];
  synonymBoost?: (result: SearchResult) => number;
  popularBoost?: (result: SearchResult) => number;
};

export const BIGRAM_TIER = 50_000;
const ENGINE_RANK_WEIGHT = 1000;

const simplifiedText = (r: SearchResult) => r.textSimplified || r.textChinese;

/** Simplified CJK bigrams of a query (e.g. 以马内利 → 以马, 马内, 内利). */
export function cjkBigrams(simplified: string): string[] {
  const grams: string[] = [];
  for (const run of simplified.match(/[\u3400-\u9fff]+/g) ?? []) {
    for (let i = 0; i + 1 < run.length; i += 1) grams.push(run.slice(i, i + 2));
  }
  return [...new Set(grams)];
}

/**
 * English relevance: whole-word matches of every query term, weighted by how focused the verse is
 * (matches / √words). "love" → 1 Jn 4:8 "God is love" before long verses that merely contain love several times.
 */
export function englishRelevance(query: string, text: string): number {
  const terms = query.toLowerCase().match(/[a-z']+/g);
  if (!terms || !text) return 0;
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  if (words.length === 0) return 0;
  let matched = 0;
  let hits = 0;
  for (const term of new Set(terms)) {
    const count = words.filter((w) => w === term).length;
    if (count > 0) matched += 1;
    hits += Math.min(count, 2);
  }
  if (matched === 0) return 0;
  const coverage = matched / new Set(terms).size;
  const density = hits / Math.sqrt(words.length);
  return Math.round(coverage * 30_000 + density * 20_000);
}

/**
 * Multi-character CJK queries: when some results contain the whole phrase, drop results that do not contain
 * every bigram of it (以马内利 used to include 赛 7:8, which has none of the phrase).
 */
export function requireAllBigramsWhenPhraseHits(results: SearchResult[], simplifiedQuery: string): SearchResult[] {
  const phrase = (simplifiedQuery.match(/[\u3400-\u9fff]+/g) ?? []).join('');
  const grams = cjkBigrams(simplifiedQuery);
  if (phrase.length < 2 || grams.length === 0) return results;
  if (!results.some((r) => simplifiedText(r).includes(phrase))) return results;
  return results.filter((r) => grams.every((g) => simplifiedText(r).includes(g)));
}

/** Share of the query's bigrams found in the verse, scaled to BIGRAM_TIER. */
export function bigramCoverage(grams: string[], text: string): number {
  if (grams.length === 0) return 0;
  return Math.round((grams.filter((g) => text.includes(g)).length / grams.length) * BIGRAM_TIER);
}

/** Final score + order for one engine's candidates (deduplicated by id, best engine score kept). */
export function rankResults(candidates: SearchResult[], ctx: RankContext): SearchResult[] {
  const byId = new Map<string, SearchResult>();
  for (const c of candidates) {
    const existing = byId.get(c.id);
    if (!existing || c.score > existing.score) byId.set(c.id, c);
  }
  const ordered = [...byId.values()].sort((a, b) => b.score - a.score);
  const n = ordered.length;
  const cjk = hasCjk(ctx.query);
  const grams = cjk ? cjkBigrams(ctx.simplified) : [];
  const latin = !cjk && /[a-z]/i.test(ctx.query);
  const variants = [...new Set(ctx.variants.map((v) => v.trim()).filter(Boolean))];

  const scored = ordered.map((result, i) => {
    let phrase = 0;
    for (const v of variants) {
      phrase = Math.max(
        phrase,
        phraseScore(v, { ...result, score: 0 }),
        phraseScore(v, { ...result, textChinese: simplifiedText(result), score: 0 }),
      );
    }
    const score =
      phrase +
      bigramCoverage(grams, simplifiedText(result)) +
      (latin ? englishRelevance(ctx.query, result.textEnglish) : 0) +
      (ctx.synonymBoost?.(result) ?? 0) +
      (ctx.popularBoost?.(result) ?? 0) +
      Math.round((1 - i / n) * ENGINE_RANK_WEIGHT);
    return { ...result, score };
  });

  const filtered = cjk ? requireAllBigramsWhenPhraseHits(scored, ctx.simplified) : scored;
  return filtered.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
