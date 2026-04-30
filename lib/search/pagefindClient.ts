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

let pagefindPromise: Promise<PagefindModule> | null = null;

async function loadPagefind(): Promise<PagefindModule> {
  if (!pagefindPromise) {
    // Keep Pagefind out of the Next bundle; it is generated into /public/pagefind at build time.
    pagefindPromise = (new Function('return import("/pagefind/pagefind.js")')() as Promise<PagefindModule>);
  }
  return pagefindPromise;
}

const toNumber = (value: string | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function mapPagefindData(data: PagefindResultData, fallbackScore: number): SearchResult | null {
  const meta = data.meta || {};
  const id = meta.id;
  const bookKey = meta.bookKey;
  const chapter = toNumber(meta.chapter);
  const verse = toNumber(meta.verse);
  const textChinese = meta.textChinese;

  if (!id || !bookKey || !chapter || !verse || !textChinese) return null;

  return {
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
}

export async function searchWithPagefind(query: string, limit = 50): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pagefind = await loadPagefind();
  const response = await pagefind.search(trimmed, { excerptLength: 12 });
  const resultData = await Promise.all(
    response.results.slice(0, limit).map(async (result, index) => {
      const data = await result.data();
      return mapPagefindData(data, result.score ?? (limit - index));
    })
  );

  return resultData.filter((result): result is SearchResult => Boolean(result));
}
