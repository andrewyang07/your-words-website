import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SearchResponse } from '@/lib/search/searchHelpers';
import type { SearchResult, ContextVerse } from '@/types/search';

export type SearchLang = 'zh' | 'en';

interface SearchState {
  query: string;
  results: SearchResult[];
  resultsTruncated: boolean;
  /** Set when pinyin results were cut to the first fragments; loads the full list. */
  loadMore: (() => Promise<SearchResponse>) | null;
  selectedIndex: number;
  searchLang: SearchLang;
  contextVerse: {
    bookKey: string;
    chapter: number;
    verse: number;
    verses: ContextVerse[];
  } | null;
  loading: boolean;
  /** True while the MiniSearch fallback downloads + indexes the Bible (first fallback query takes seconds). */
  fallbackLoading: boolean;
  engineReady: boolean;

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[], truncated?: boolean, loadMore?: SearchResponse['loadMore']) => void;
  setSelectedIndex: (index: number) => void;
  setSearchLang: (lang: SearchLang) => void;
  setContextVerse: (ctx: SearchState['contextVerse']) => void;
  setLoading: (loading: boolean) => void;
  setFallbackLoading: (fallbackLoading: boolean) => void;
  setEngineReady: (ready: boolean) => void;
  clearSearch: () => void;
}

function detectDefaultLang(): SearchLang {
  if (typeof navigator === 'undefined') return 'zh';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('en')) return 'en';
  return 'zh';
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      results: [],
      resultsTruncated: false,
      loadMore: null,
      selectedIndex: -1,
      // Server and first client render must agree (React #418): start at 'zh' and apply the saved / browser
      // language only after hydration, via hydrateSearchStore().
      searchLang: 'zh',
      contextVerse: null,
      loading: false,
      fallbackLoading: false,
      engineReady: false,

      setQuery: (query) => set({ query }),
      setResults: (results, truncated = false, loadMore) =>
        set({ results, resultsTruncated: truncated, loadMore: loadMore ?? null, selectedIndex: -1 }),
      setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
      setSearchLang: (searchLang) => set({ searchLang }),
      setContextVerse: (contextVerse) => set({ contextVerse }),
      setLoading: (loading) => set(loading ? { loading } : { loading, fallbackLoading: false }),
      setFallbackLoading: (fallbackLoading) => set({ fallbackLoading }),
      setEngineReady: (engineReady) => set({ engineReady }),
      clearSearch: () =>
        set({
          query: '',
          results: [],
          resultsTruncated: false,
          loadMore: null,
          selectedIndex: -1,
          contextVerse: null,
        }),
    }),
    {
      name: 'bible-search',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchLang: state.searchLang,
      }),
      skipHydration: true,
    },
  ),
);

/**
 * Apply the saved search language (or the browser default when nothing is saved). Call from an effect after the
 * first render; reading localStorage / navigator during render made the client HTML differ from the server's.
 */
export function hydrateSearchStore(): void {
  const saved = typeof localStorage !== 'undefined' && localStorage.getItem('bible-search') !== null;
  void useSearchStore.persist.rehydrate();
  if (!saved) useSearchStore.setState({ searchLang: detectDefaultLang() });
}
