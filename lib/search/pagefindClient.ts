import type { SearchResult } from '@/types/search';
import { PINYIN_BUNDLES } from './pagefindShards.mjs';
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
  init?: () => Promise<void>;
  preload?: (term: string) => Promise<void>;
  search: (
    query: string,
    options?: { excerptLength?: number; filters?: Record<string, unknown> },
  ) => Promise<PagefindSearchResponse>;
};

type OpenCCModule = {
  Converter: (options: { from: string; to: string }) => (value: string) => string;
};

let pagefindPromise: Promise<PagefindModule> | null = null;
/** One Pagefind instance per pinyin part (each part's own pagefind.js), loaded in parallel. */
let pinyinPromise: Promise<PagefindModule[]> | null = null;
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

/** Test hook: the main index module and (optionally) the pinyin part modules. */
export function resetPagefindClientForTests(module?: PagefindModule, pinyin?: PagefindModule | PagefindModule[]): void {
  pagefindPromise = module ? Promise.resolve(module) : null;
  mainSearchCache.clear();
  pinyinPromise = pinyin ? Promise.resolve(Array.isArray(pinyin) ? pinyin : [pinyin]) : null;
  pagefindFetchFailures = 0;
}

/** Start loading the pinyin index (search code, both parts' metas; with a query, its index chunks) without searching. */
export function preloadPinyinPagefind(query?: string): void {
  // With a query: also fetch the index chunks its pinyin searches will read (Pagefind preload).
  const terms = query ? pinyinSearchesFor(query.trim()).map((s) => s.term) : [];
  void loadPinyinPagefind()
    .then((parts) =>
      Promise.all(
        parts.flatMap((part) =>
          terms.length > 0
            ? terms.map((term) => part.preload?.(term) ?? Promise.resolve())
            : [part.init?.() ?? Promise.resolve()],
        ),
      ),
    )
    .catch(() => undefined);
}

/** Warm Pagefind + OpenCC (idle / focus) so the first real query does not pay for loading them. */
export async function preloadPagefind(): Promise<void> {
  await Promise.all([loadPagefind(), loadOpenCC()]);
}

/**
 * Search the pinyin parts as one index without Pagefind's per-index loosening. A part with no entry for a query
 * word does not return nothing: it ignores the word or falls back to a shorter prefix. Verses are dealt to the parts
 * round-robin, so a real match count is about the same in every part; a part returning far more than the smallest
 * count is loosened and left out. Kept results are merged by Pagefind score.
 */
export function strictShards(counts: number[]): boolean[] {
  const min = Math.min(...counts);
  const limit = min + 5 * Math.sqrt(min + 1) + 10;
  return counts.map((count) => count <= limit);
}

async function shardedSearch(parts: PagefindModule[], term: string): Promise<PagefindSearchResponse> {
  const perPart = await Promise.all(parts.map((part) => part.search(term, { excerptLength: 12 })));
  if (perPart.length === 1) return perPart[0]!;
  const keep = strictShards(perPart.map((response) => response.results.length));
  const results = perPart.flatMap((response, part) => (keep[part] ? response.results : []));
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
        return module;
      },
    );
  }
  return pagefindPromise;
}

/**
 * The pinyin index: one Pagefind instance per part (a separate copy of pagefind.js each), all loaded in parallel.
 * mergeIndex would load the parts one after another (two extra round trips before the first pinyin search).
 */
async function loadPinyinPagefind(): Promise<PagefindModule[]> {
  installPagefindFetchTracker();
  if (!pinyinPromise) {
    const load = new Function('url', 'return import(url)') as (url: string) => Promise<PagefindModule>;
    pinyinPromise = Promise.all(
      PINYIN_BUNDLES.map(async (base) => {
        const part = await load(`${base}pagefind.js`);
        // Pagefind's Web Worker: pinyin index work runs off the main thread, in parallel with the main index
        // (main-thread mode only matters for detecting failed loads, and a failed pinyin load just means no pinyin
        // results).
        await part.options?.({ basePath: base });
        return part;
      }),
    ).catch((error: unknown) => {
      pinyinPromise = null;
      throw error;
    });
  }
  return pinyinPromise;
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

/** Thrown when a search is abandoned because a newer query replaced it. */
export class StaleSearchError extends Error {
  constructor() {
    super('search superseded by a newer query');
    this.name = 'StaleSearchError';
  }
}

/** Pinyin sub-searches for a query (Latin only): full / prefix / 模糊音 pinyin, or 首字母 initials. */
function pinyinSearchesFor(trimmed: string): { term: string; weight: number }[] {
  if (hasCjk(trimmed)) return [];
  // G1 (T5): Latin input is tried both as English (variants) and as pinyin (prefixed pinyin tokens), scored apart.
  const pinyinSyllables = segmentPinyin(trimmed);
  const pinyinTerms = pinyinSyllables ? pinyinQueryTerms(pinyinSyllables, !/\s/.test(trimmed)) : null;
  const searches: { term: string; weight: number }[] = [];
  if (pinyinTerms?.exact) searches.push({ term: pinyinTerms.exact, weight: PINYIN_TIER });
  if (pinyinTerms?.prefix) searches.push({ term: pinyinTerms.prefix, weight: PINYIN_TIER });
  if (pinyinTerms?.fuzzy) searches.push({ term: pinyinTerms.fuzzy, weight: PINYIN_FUZZY_TIER });
  // 首字母 (T6): "sasr", "shenasr". Only when the input is not plain pinyin; scored below a real English match so
  // English words that happen to look like initials ("god") still rank by English relevance.
  if (!pinyinSyllables && !/\s/.test(trimmed)) {
    for (const reading of initialsReadings(trimmed)) {
      searches.push({ term: initialsQueryTerm(reading), weight: INITIALS_TIER });
    }
  }
  return searches;
}

/** True when the pinyin index could add results for this query (Latin text that reads as pinyin or initials). */
export function couldBePinyin(query: string): boolean {
  return pinyinSearchesFor(query.trim()).length > 0;
}

export type PagefindSearchOptions = {
  /** Also search the pinyin index (loading it if needed). false = main index only (fast first results). */
  pinyin?: boolean;
  /** Called with the main index's raw hit count as soon as it is known (before any fragment loads). */
  onMainHits?: (count: number) => void;
  /** Load at most this many result fragments per pinyin sub-search (first screen); default all ranked ones. */
  pinyinTop?: number;
  /** Checked before fragments are fetched; false (a newer query was typed) abandons this search. */
  isCurrent?: () => boolean;
};

/**
 * Main-index searches, memoised per term for the current page: the two-step pinyin search runs the same word /
 * bigram searches again, and their result data is then reused instead of fetched twice.
 */
const mainSearchCache = new Map<string, Promise<PagefindSearchResponse>>();
function mainSearch(pagefind: PagefindModule, term: string): Promise<PagefindSearchResponse> {
  let cached = mainSearchCache.get(term);
  if (!cached) {
    cached = pagefind.search(term, { excerptLength: 12 }).then((response) => ({
      results: response.results.map((result) => {
        let data: Promise<PagefindResultData> | null = null;
        return {
          ...result,
          data: () => {
            data ??= result.data().catch((error: unknown) => {
              data = null;
              throw error;
            });
            return data;
          },
        };
      }),
    }));
    cached.catch(() => mainSearchCache.delete(term));
    mainSearchCache.set(term, cached);
    if (mainSearchCache.size > 50) mainSearchCache.delete(mainSearchCache.keys().next().value!);
  }
  return cached;
}

export async function searchWithPagefind(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
  { pinyin = true, onMainHits, pinyinTop, isCurrent }: PagefindSearchOptions = {},
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], truncated: false };

  const failuresBefore = pagefindFetchFailures;
  const pagefind = await loadPagefind();
  const variants = await getQueryVariants(trimmed);
  const cjk = hasCjk(trimmed);
  // Pagefind's zh segmenter only indexes dictionary words (出发, 以马内利 were unfindable), so CJK queries also
  // search the bigram tokens the index build adds for the Simplified text.
  const bigramQuery = cjk ? toCjkBigramQuery((await loadOpenCC()).toSimplified(trimmed)) : null;
  // The pinyin index is optional: if it cannot load, the main-index results still stand.
  const pinyinIndex = pinyin && couldBePinyin(trimmed) ? await loadPinyinPagefind().catch(() => null) : null;
  const pinyinSearches = pinyinIndex ? pinyinSearchesFor(trimmed) : [];

  const wordSearches = unique(variants.map(dropStopTerms).filter((v): v is string => v !== null));
  const searches = [...wordSearches, ...(bigramQuery ? [bigramQuery] : []), ...pinyinSearches.map((p) => p.term)];
  const pinyinOffset = searches.length - pinyinSearches.length;
  const isPinyin = (index: number) => index >= pinyinOffset;
  const responses = await Promise.all(
    searches.map((term, index) => (isPinyin(index) ? shardedSearch(pinyinIndex!, term) : mainSearch(pagefind, term))),
  );
  onMainHits?.(responses.reduce((n, response, index) => n + (isPinyin(index) ? 0 : response.results.length), 0));
  // Engine relevance = sum over the sub-searches (each script variant + the bigram search) of 1 − rank/len, so a
  // verse found high by several sub-searches beats one found by a single search; raw Pagefind scores of
  // different sub-searches are not comparable. Pinyin sub-searches also give a pinyin tier from their own rank.
  if (isCurrent && !isCurrent()) throw new StaleSearchError();
  const fullTop = Math.max(limit * 3, 100);
  const tops = responses.map((response, index) =>
    response.results.slice(0, isPinyin(index) && pinyinTop ? Math.min(pinyinTop, fullTop) : fullTop),
  );
  const pinyinCut = responses.some(
    (response, index) => isPinyin(index) && response.results.length > tops[index]!.length,
  );
  const datas = await Promise.all(tops.map((top) => Promise.all(top.map(loadResultData))));
  const byId = new Map<string, SearchResult>();
  const pinyinScore = new Map<string, number>();
  for (let index = 0; index < responses.length; index += 1) {
    const top = tops[index]!;
    const data = datas[index]!;
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
    mainSearchCache.clear(); // do not keep results computed from a failed chunk
    throw new PagefindLoadError('a /pagefind/ index or fragment request failed during this search');
  }

  const truncated = ranked.length > limit;
  return {
    results: ranked.slice(0, limit),
    truncated: truncated || pinyinCut,
    ...(pinyinCut ? { loadMore: () => searchWithPagefind(query, limit, { pinyin: true }) } : {}),
  };
}
