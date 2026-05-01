import type { SearchResult } from '@/types/search';

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

type PagefindModule = {
  search: (query: string, options?: { excerptLength?: number }) => Promise<PagefindSearchResponse>;
};

type OpenCCModule = {
  Converter: (options: { from: string; to: string }) => (value: string) => string;
};

let pagefindPromise: Promise<PagefindModule> | null = null;
let openCCPromise: Promise<{ toTraditional: (value: string) => string; toSimplified: (value: string) => string }> | null = null;

async function loadPagefind(): Promise<PagefindModule> {
  if (!pagefindPromise) {
    // Keep Pagefind out of the Next bundle; it is generated into /public/pagefind at build time.
    pagefindPromise = (new Function('return import("/pagefind/pagefind.js")')() as Promise<PagefindModule>);
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

const hasCjk = (value: string) => /[\u3400-\u9fff]/.test(value);

const COMMON_SEARCH_TERMS = [
  'love', 'loved', 'beginning', 'faith', 'hope', 'grace', 'peace', 'truth', 'life', 'light',
  'god', 'lord', 'jesus', 'christ', 'spirit', 'wisdom', 'mercy', 'righteousness', 'salvation',
  'forgiveness', 'kingdom', 'heaven', 'earth', 'creation', 'resurrection', 'prayer', 'covenant',
  'yuehan', 'yesu', 'yehehua', 'shenaishiren', 'taichuyoudao', 'shipian', 'luoma', 'matai',
];

function damerauLevenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[a.length][b.length];
}

function getCorrectionVariants(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  if (!/^[a-z\s]+$/.test(normalized) || normalized.length < 4) return [];

  const joined = normalized.replace(/\s+/g, '');
  const candidates = COMMON_SEARCH_TERMS
    .map((term) => ({ term, distance: damerauLevenshtein(joined, term) }))
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

function phraseScore(query: string, result: SearchResult): number {
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
  if (normalizedQuery.length > 1 && haystacks.some((value) => value.replace(/\s+/g, '').includes(normalizedQuery))) {
    boost += 80_000;
  }

  return boost + result.score;
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
    textEnglish: meta.textEnglish || '',
    score: fallbackScore,
    matchType: 'keyword',
  };

  return {
    ...result,
    score: phraseScore(query, result),
  };
}

export async function searchWithPagefind(query: string, limit = 50): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pagefind = await loadPagefind();
  const variants = await getQueryVariants(trimmed);
  const responses = await Promise.all(variants.map((variant) => pagefind.search(variant, { excerptLength: 12 })));
  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  for (let variantIndex = 0; variantIndex < responses.length; variantIndex += 1) {
    const response = responses[variantIndex];
    const variant = variants[variantIndex];
    const data = await Promise.all(
      response.results.slice(0, Math.max(limit * 3, 100)).map(async (result, index) => {
        const resultData = await result.data();
        return mapPagefindData(resultData, result.score ?? (limit - index), variant);
      })
    );

    for (const result of data) {
      if (!result || seen.has(result.id)) continue;
      seen.add(result.id);
      merged.push(result);
    }
  }

  return merged.sort((a, b) => b.score - a.score).slice(0, limit);
}
