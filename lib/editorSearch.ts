'use client';

import { getSearchEngine } from '@/lib/search/searchEngine';
import type { SearchResult } from '@/types/search';

export interface SuggestionItem {
  id: string;
  label: string;
  reference: string;
  preview: string;
  bookKey: string;
  chapter: number;
  verse: number;
}

function toSuggestionItem(r: SearchResult): SuggestionItem {
  const ref = `${r.bookKey}${r.chapter}:${r.verse}`;
  return {
    id: r.id,
    label: `${r.bookTraditional} ${r.chapter}:${r.verse}`,
    reference: ref,
    preview: r.textChinese.length > 60 ? r.textChinese.slice(0, 60) + '…' : r.textChinese,
    bookKey: r.bookKey,
    chapter: r.chapter,
    verse: r.verse,
  };
}

let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = getSearchEngine().initialize().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export async function searchVerses(query: string): Promise<SuggestionItem[]> {
  const engine = getSearchEngine();
  if (!engine.initialized) {
    await ensureInitialized();
  }
  const results = await engine.search(query);
  return results.slice(0, 8).map(toSuggestionItem);
}

export function isSearchReady(): boolean {
  return getSearchEngine().initialized;
}

export { ensureInitialized as initializeSearch };
