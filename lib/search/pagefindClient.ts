import type { SearchResult } from '@/types/search';
import { DEFAULT_SEARCH_LIMIT, hasCjk, phraseScore, type SearchResponse } from './searchHelpers';

export { hasCjk } from './searchHelpers';

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
  search: (query: string, options?: { excerptLength?: number }) => Promise<PagefindSearchResponse>;
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
  pagefindPromise = module ? Promise.resolve(module) : null;
  pagefindFetchFailures = 0;
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

/** Bigram (contiguous-ish CJK) hits rank above plain Pagefind word hits; exact phrases rank above both. */
const BIGRAM_TIER = 50_000;

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
export async function searchWithPagefind(query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], truncated: false };

  const failuresBefore = pagefindFetchFailures;
  const pagefind = await loadPagefind();
  const variants = await getQueryVariants(trimmed);
  // Pagefind's zh segmenter only indexes dictionary words (出发, 以马内利 were unfindable), so CJK queries also
  // search the bigram tokens the index build adds for the Simplified text.
  const bigramQuery = hasCjk(trimmed) ? toCjkBigramQuery((await loadOpenCC()).toSimplified(trimmed)) : null;
  const searches = bigramQuery ? [...variants, bigramQuery] : variants;
  const responses = await Promise.all(searches.map((term) => pagefind.search(term, { excerptLength: 12 })));
  const byId = new Map<string, SearchResult>();

  for (let index = 0; index < responses.length; index += 1) {
    const response = responses[index]!;
    const isBigram = bigramQuery !== null && index === responses.length - 1;
    const data = await Promise.all(response.results.slice(0, Math.max(limit * 3, 100)).map(loadResultData));
    data.forEach((resultData, rank) => {
      const mapped = mapPagefindData(resultData, (response.results[rank]?.score ?? 0) - rank / 1000, '');
      if (!mapped) return;
      const existing = byId.get(mapped.id);
      const tier = isBigram ? BIGRAM_TIER : 0;
      if (existing) {
        existing.score = Math.max(existing.score, mapped.score + tier);
      } else {
        byId.set(mapped.id, {
          ...mapped,
          score: mapped.score + tier,
        });
      }
    });
  }

  // Phrase boost against every variant and both scripts (the first variant may be Simplified while
  // textChinese is Traditional, which used to leave the right verses unboosted).
  const merged: SearchResult[] = [...byId.values()].map((result) => {
    const textSimplified = result.textSimplified ?? '';
    let best = 0;
    for (const variant of variants) {
      best = Math.max(
        best,
        phraseScore(variant, { ...result, score: 0 }),
        phraseScore(variant, { ...result, textChinese: textSimplified, score: 0 }),
      );
    }
    return { ...result, score: result.score + best };
  });

  if (pagefindFetchFailures > failuresBefore) {
    throw new PagefindLoadError('a /pagefind/ index or fragment request failed during this search');
  }

  const sorted = merged.sort((a, b) => b.score - a.score);
  const truncated = sorted.length > limit;
  return {
    results: sorted.slice(0, limit),
    truncated,
  };
}
