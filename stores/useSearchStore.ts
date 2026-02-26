import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SearchResult, ContextVerse } from '@/types/search';

export type SearchLang = 'zh' | 'en';

interface SearchState {
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  searchLang: SearchLang;
  contextVerse: {
    bookKey: string;
    chapter: number;
    verse: number;
    verses: ContextVerse[];
  } | null;
  loading: boolean;
  engineReady: boolean;

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setSelectedIndex: (index: number) => void;
  setSearchLang: (lang: SearchLang) => void;
  setContextVerse: (ctx: SearchState['contextVerse']) => void;
  setLoading: (loading: boolean) => void;
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
      selectedIndex: -1,
      searchLang: detectDefaultLang(),
      contextVerse: null,
      loading: false,
      engineReady: false,

      setQuery: (query) => set({ query }),
      setResults: (results) => set({ results, selectedIndex: -1 }),
      setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
      setSearchLang: (searchLang) => set({ searchLang }),
      setContextVerse: (contextVerse) => set({ contextVerse }),
      setLoading: (loading) => set({ loading }),
      setEngineReady: (engineReady) => set({ engineReady }),
      clearSearch: () =>
        set({ query: '', results: [], selectedIndex: -1, contextVerse: null }),
    }),
    {
      name: 'bible-search',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchLang: state.searchLang,
      }),
    }
  )
);
