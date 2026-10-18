import type { SearchResult } from '@/types/search';
import { PAGEFIND_EXTRA_SHARDS, PAGEFIND_SHARD_COUNT } from './pagefindShards.mjs';
import { initialsQueryTerm, initialsReadings, pinyinQueryTerms, segmentPinyin } from './pinyinTokens.mjs';
import { rankResults } from './rankResults';
import {
  DEFAULT_SEARCH_LIMIT,
  HEAVY_CJK,
  HEAVY_WORDS,
  hasCjk,
  phraseScore,
  type SearchResponse,
} from './searchHelpers';

export { hasCjk } from './searchHelpers';
export { cjkBigrams, englishRelevance, requireAllBigramsWhenPhraseHits } from './rankResults';

type PagefindResultData = {
  meta?: Record<string, string>;
  weighted_locations?: Array<{ weight?: number }>;
};

type PagefindSearchResult = {
  id: string;
  score?: number;
  data: () => Promise<PagefindResultData>;
};

type PagefindSearchResponse = {
  results: PagefindSearchResult[];
};

export type PagefindModule = {
  options?: (options: Record<string, unknown>) => Promise<void>;
  search: (
    query: string,
    options?: { excerptLength?: number; filters?: Record<string, unknown> },
  ) => Promise<PagefindSearchResponse>;
  mergeIndex?: (basePath: string, options?: Record<string, unknown>) => Promise<void>;
};

type OpenCCModule = {
  Converter: (options: { from: string; to: string }) => (value: string) => string;
};

let pagefindPromise: Promise<PagefindModule> | null = null;
let openCCPromise: Promise<{
  toTraditional: (value: string) => string;
  toSimplified: (value: string) => string;
}> | null = null;

/** Thrown when Pagefind could not load part of its bundle; callers fall back to MiniSearch. */
export class PagefindLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PagefindLoadError';
  }
}

// Pagefind swallows failed index/fragment loads (it logs "invalid gzip data" and returns empty results), which
// happens when an open tab or a stale cached pagefind.js/pagefind-entry.json points at hashes a newer deploy
// removed. Count failed /pagefind/ fetches so a search that hit one is treated as a failure, not "no results".
let pagefindFetchFailures = 0;
let fetchTrackerInstalled = false;

function isPagefindRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return url.includes('/pagefind/');
}

export function installPagefindFetchTracker(target: typeof globalThis = globalThis): void {
  if (fetchTrackerInstalled || typeof target.fetch !== 'function') return;
  fetchTrackerInstalled = true;
  const originalFetch = target.fetch.bind(target);
  target.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const tracked = isPagefindRequest(input);
    try {
      const response = await originalFetch(input, init);
      if (tracked && !response.ok) pagefindFetchFailures += 1;
      return response;
    } catch (error) {
      if (tracked) pagefindFetchFailures += 1;
      throw error;
    }
  };
}

/** Test hook. */
export function resetPagefindClientForTests(module?: PagefindModule): void {
  pagefindPromise = module ? mergeShards(module).then(() => module) : null;
  pagefindFetchFailures = 0;
}

/** Warm Pagefind + OpenCC (idle / focus) so the first real query does not pay for loading them. */
export async function preloadPagefind(): Promise<void> {
  await Promise.all([loadPagefind(), loadOpenCC()]);
}

/** Merge the other index bundles (pagefindShards.mjs) into the primary one; they are searched as one index. */
async function mergeShards(module: PagefindModule): Promise<void> {
  if (typeof module.mergeIndex !== 'function') return;
  await Promise.all(PAGEFIND_EXTRA_SHARDS.map((basePath) => module.mergeIndex!(basePath)));
}

/**
 * Search the bundles as one index without Pagefind's per-bundle loosening. A bundle with no entry for a query word
 * does not return nothing: it ignores the word or falls back to a shorter prefix (神爱世人 found John 3:16 in one
 * bundle and ~940 verses with 神 in each of the others; sasr matched 767 "sa…" verses in one bundle). Verses are
 * dealt to the bundles round-robin, so a real match count is about the same in every bundle; a bundle returning
 * far more than the smallest count is loosened and left out. Kept results are merged by Pagefind score.
 */
export function strictShards(counts: number[]): boolean[] {
  const min = Math.min(...counts);
  const limit = min + 5 * Math.sqrt(min + 1) + 10;
  return counts.map((count) => count <= limit);
}

async function shardedSearch(pagefind: PagefindModule, term: string): Promise<PagefindSearchResponse> {
  if (typeof pagefind.mergeIndex !== 'function' || PAGEFIND_SHARD_COUNT < 2) {
    return pagefind.search(term, { excerptLength: 12 });
  }
  const perShard = await Promise.all(
    Array.from({ length: PAGEFIND_SHARD_COUNT }, (_, shard) =>
      pagefind.search(term, { excerptLength: 12, filters: { shard: String(shard) } }),
    ),
  );
  const keep = strictShards(perShard.map((response) => response.results.length));
  const results = perShard.flatMap((response, shard) => (keep[shard] ? response.results : []));
  results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return { results };
}

async function loadPagefind(): Promise<PagefindModule> {
  installPagefindFetchTracker();
  if (!pagefindPromise) {
    // Keep Pagefind out of the Next bundle; it is generated into /public/pagefind at build time.
    pagefindPromise = (new Function('return import("/pagefind/pagefind.js")')() as Promise<PagefindModule>).then(
      async (module) => {
        // Run Pagefind on the main thread: in its Web Worker, index/fragment fetches bypass the fetch tracker
        // above and load failures can't be detected. Must be set before the first search initialises it.
        await module.options?.({ noWorker: true });
        await mergeShards(module);
        return module;
      },
    );
  }
  return pagefindPromise;
}

async function loadOpenCC() {
  if (!openCCPromise) {
    openCCPromise = import('opencc-js').then((module) => {
      const opencc = module as unknown as OpenCCModule;
      return {
        toTraditional: opencc.Converter({ from: 'cn', to: 'tw' }),
        toSimplified: opencc.Converter({ from: 'tw', to: 'cn' }),
      };
    });
  }
  return openCCPromise;
}

const toNumber = (value: string | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const COMMON_SEARCH_TERMS = [
  'love',
  'loved',
  'beginning',
  'faith',
  'hope',
  'grace',
  'peace',
  'truth',
  'life',
  'light',
  'god',
  'lord',
  'jesus',
  'christ',
  'spirit',
  'wisdom',
  'mercy',
  'righteousness',
  'salvation',
  'forgiveness',
  'kingdom',
  'heaven',
  'earth',
  'creation',
  'resurrection',
  'prayer',
  'covenant',
  'yuehan',
  'yesu',
  'yehehua',
  'shenaishiren',
  'taichuyoudao',
  'shipian',
  'luoma',
  'matai',
];

function damerauLevenshtein(a: string, b: string): number {
  const width = b.length + 1;
  // Flat (a.length + 1) × (b.length + 1) matrix; every index below is in bounds.
  const matrix = new Array<number>((a.length + 1) * width).fill(0);
  const at = (i: number, j: number) => matrix[i * width + j]!;
  const set = (i: number, j: number, value: number) => {
    matrix[i * width + j] = value;
  };

  for (let i = 0; i <= a.length; i += 1) set(i, 0, i);
  for (let j = 0; j <= b.length; j += 1) set(0, j, j);

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      set(i, j, Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost));

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        set(i, j, Math.min(at(i, j), at(i - 2, j - 2) + 1));
      }
    }
  }

  return at(a.length, b.length);
}

function getCorrectionVariants(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  if (!/^[a-z\s]+$/.test(normalized) || normalized.length < 4) return [];

  const joined = normalized.replace(/\s+/g, '');
  const candidates = COMMON_SEARCH_TERMS.map((term) => ({ term, distance: damerauLevenshtein(joined, term) }))
    .filter(({ term, distance }) => distance > 0 && distance <= (term.length <= 5 ? 1 : 2))
    .sort((a, b) => a.distance - b.distance || a.term.length - b.term.length)
    .slice(0, 2)
    .map(({ term }) => term);

  return candidates;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function getQueryVariants(query: string): Promise<string[]> {
  const variants = [query, ...getCorrectionVariants(query)];

  if (hasCjk(query)) {
    const { toTraditional, toSimplified } = await loadOpenCC();
    variants.push(toTraditional(query), toSimplified(query));
  }

  return unique(variants);
}

/** Must match cjkBigrams in scripts/build-pagefind-index.mjs. */
export function toCjkBigramQuery(simplified: string): string | null {
  const tokens: string[] = [];
  for (const run of simplified.match(/[\u3400-\u9fff]+/g) ?? []) {
    for (let i = 0; i + 1 < run.length; i += 1) {
      tokens.push(`q${run.codePointAt(i)!.toString(36)}${run.codePointAt(i + 1)!.toString(36)}`);
    }
  }
  return tokens.length > 0 ? [...new Set(tokens)].join(' ') : null;
}

/** Must match chapterToken in scripts/build-pagefind-index.mjs. */
export function chapterToken(bookOrder: number, chapter: number): string {
  return `ch${bookOrder}x${chapter}`;
}

async function loadResultData(result: PagefindSearchResult): Promise<PagefindResultData> {
  let resultData: PagefindResultData | undefined;
  try {
    resultData = await result.data();
  } catch (error) {
    throw new PagefindLoadError(`fragment load failed: ${String(error)}`);
  }
  if (!resultData) throw new PagefindLoadError('fragment load returned no data');
  return resultData;
}

/** Every verse of one chapter, in verse order (chapter-only references such as 诗篇 23). */
export async function searchChapterWithPagefind(bookOrder: number, chapter: number): Promise<SearchResult[]> {
  const failuresBefore = pagefindFetchFailures;
  const pagefind = await loadPagefind();
  const response = await pagefind.search(chapterToken(bookOrder, chapter));
  const data = await Promise.all(response.results.map(loadResultData));
  if (pagefindFetchFailures > failuresBefore) {
    throw new PagefindLoadError('a /pagefind/ request failed during a chapter lookup');
  }
  return data
    .map((d) => mapPagefindData(d, 0, ''))
    .filter((r): r is SearchResult => r !== null && r.chapter === chapter)
    .map((r) => ({ ...r, matchType: 'reference' as const }))
    .sort((a, b) => a.verse - b.verse);
}

function mapPagefindData(data: PagefindResultData, fallbackScore: number, query: string): SearchResult | null {
  const meta = data.meta || {};
  const id = meta.id;
  const bookKey = meta.bookKey;
  const chapter = toNumber(meta.chapter);
  const verse = toNumber(meta.verse);
  const textChinese = meta.textChinese;

  if (!id || !bookKey || !chapter || !verse || !textChinese) return null;

  const result: SearchResult = {
    id,
    bookKey,
    bookTraditional: meta.bookTraditional || bookKey,
    bookEnglish: meta.bookEnglish || '',
    chapter,
    verse,
    textChinese,
    ...(meta.textSimplified ? { textSimplified: meta.textSimplified } : {}),
    textEnglish: meta.textEnglish || '',
    score: fallbackScore,
    matchType: 'keyword',
  };

  return {
    ...result,
    score: query ? phraseScore(query, result) : fallbackScore,
  };
}

/**
 * Pagefind search with OpenCC query variants + phrase boost.
 * Returns truncated=true when more than `limit` unique hits exist.
 */
/** Pinyin matches (exact pairs / whole-verse prefix) vs 模糊音 pairs; comparable to the English tier (≤ ~50k). */
const PINYIN_TIER = 60_000;
const PINYIN_FUZZY_TIER = 45_000;
/** Initials matches: below a full English match (coverage alone is 30k), above engine-rank noise. */
const INITIALS_TIER = 25_000;

/** Drop heavy stop terms (searchHelpers HEAVY_*) from a word sub-search; null when nothing would remain. */
export function dropStopTerms(term: string): string | null {
  if (hasCjk(term)) {
    const rest = term.replace(HEAVY_CJK, '');
    return /[\u3400-\u9fff]/.test(rest) ? rest : null;
  }
  const words = term.split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !HEAVY_WORDS.has(w.toLowerCase()));
  if (kept.length === 0) return null;
  return kept.length === words.length ? term : kept.join(' ');
}

export async function searchWithPagefind(query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], truncated: false };

  const failuresBefore = pagefindFetchFailures;
  const pagefind = await loadPagefind();
  const variants = await getQueryVariants(trimmed);
  const cjk = hasCjk(trimmed);
  // Pagefind's zh segmenter only indexes dictionary words (出发, 以马内利 were unfindable), so CJK queries also
  // search the bigram tokens the index build adds for the Simplified text.
  const bigramQuery = cjk ? toCjkBigramQuery((await loadOpenCC()).toSimplified(trimmed)) : null;
  // G1 (T5): Latin input is tried both as English (variants) and as pinyin (prefixed pinyin tokens), scored apart.
  const pinyinSyllables = cjk ? null : segmentPinyin(trimmed);
  const pinyinTerms = pinyinSyllables ? pinyinQueryTerms(pinyinSyllables, !/\s/.test(trimmed)) : null;
  const pinyinSearches: { term: string; weight: number }[] = [];
  if (pinyinTerms?.exact) pinyinSearches.push({ term: pinyinTerms.exact, weight: PINYIN_TIER });
  if (pinyinTerms?.prefix) pinyinSearches.push({ term: pinyinTerms.prefix, weight: PINYIN_TIER });
  if (pinyinTerms?.fuzzy) pinyinSearches.push({ term: pinyinTerms.fuzzy, weight: PINYIN_FUZZY_TIER });
  // 首字母 (T6): "sasr", "shenasr". Only when the input is not plain pinyin; scored below a real English match so
  // English words that happen to look like initials ("god") still rank by English relevance.
  if (!cjk && !pinyinSyllables && !/\s/.test(trimmed)) {
    for (const reading of initialsReadings(trimmed)) {
      pinyinSearches.push({ term: initialsQueryTerm(reading), weight: INITIALS_TIER });
    }
  }

  const wordSearches = unique(variants.map(dropStopTerms).filter((v): v is string => v !== null));
  const searches = [...wordSearches, ...(bigramQuery ? [bigramQuery] : []), ...pinyinSearches.map((p) => p.term)];
  const responses = await Promise.all(searches.map((term) => shardedSearch(pagefind, term)));
  // Engine relevance = sum over the sub-searches (each script variant + the bigram search) of 1 − rank/len, so a
  // verse found high by several sub-searches beats one found by a single search; raw Pagefind scores of
  // different sub-searches are not comparable. Pinyin sub-searches also give a pinyin tier from their own rank.
  const byId = new Map<string, SearchResult>();
  const pinyinScore = new Map<string, number>();
  const pinyinOffset = searches.length - pinyinSearches.length;
  for (let index = 0; index < responses.length; index += 1) {
    const response = responses[index]!;
    const top = response.results.slice(0, Math.max(limit * 3, 100));
    const data = await Promise.all(top.map(loadResultData));
    const weight = index >= pinyinOffset ? pinyinSearches[index - pinyinOffset]!.weight : 0;
    data.forEach((resultData, rank) => {
      const mapped = mapPagefindData(resultData, 1 - rank / top.length, '');
      if (!mapped) return;
      if (weight > 0) {
        const tier = Math.round(weight * (1 - rank / (2 * top.length)));
        pinyinScore.set(mapped.id, Math.max(pinyinScore.get(mapped.id) ?? 0, tier));
      }
      const existing = byId.get(mapped.id);
      if (existing) existing.score += mapped.score;
      else byId.set(mapped.id, mapped);
    });
  }
  const candidates = [...byId.values()];
  // Shared with the MiniSearch fallback (T4): phrase / bigram / English tiers + engine-rank tiebreak.
  const simplified = hasCjk(trimmed) ? (await loadOpenCC()).toSimplified(trimmed) : trimmed;
  const ranked = rankResults(candidates, {
    query: trimmed,
    simplified,
    variants,
    pinyinBoost: (r) => pinyinScore.get(r.id) ?? 0,
  });

  if (pagefindFetchFailures > failuresBefore) {
    throw new PagefindLoadError('a /pagefind/ index or fragment request failed during this search');
  }

  const truncated = ranked.length > limit;
  return {
    results: ranked.slice(0, limit),
    truncated,
  };
}
