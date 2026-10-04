import { create } from 'zustand';
import { VerseState } from '@/types/store';
import { loadPresetVerses, loadBooks } from '@/lib/dataLoader';

// The persisted UI language is applied after hydration, so loads for the default script can still be in
// flight when the saved script's load starts. Only the most recent request may write to the store:
// results, loaded/loading flags and errors from superseded requests are ignored.
let latestVersesRequest = 0;
let latestBooksRequest = 0;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export const useVerseStore = create<VerseState>((set, get) => ({
  // 初始状态
  verses: [],
  books: [],
  filteredVerses: [],
  versesLoaded: false,
  booksLoaded: false,
  versesLoading: false,
  booksLoading: false,
  versesError: null,
  booksError: null,

  // Actions
  setVerses: (verses) => set({ verses, filteredVerses: verses, versesLoaded: true }),
  setBooks: (books) => set({ books, booksLoaded: true }),
  setFilteredVerses: (filteredVerses) => set({ filteredVerses }),

  // 加载经文数据 (resolves false for a superseded request; stale failures are swallowed)
  loadVerses: async (mode, language) => {
    if (mode !== 'preset') return true; // chapter 模式在选择书卷章节时动态加载
    const request = ++latestVersesRequest;
    set({ versesLoading: true, versesError: null });
    try {
      const verses = await loadPresetVerses(language);
      if (request !== latestVersesRequest) return false;
      set({ verses, filteredVerses: verses, versesLoaded: true, versesLoading: false });
      return true;
    } catch (error) {
      if (request !== latestVersesRequest) return false;
      set({ versesLoading: false, versesError: errorMessage(error, '加载经文失败') });
      console.error('加载经文失败:', error);
      throw error;
    }
  },

  // 加载书卷信息
  loadBooks: async (language = 'traditional') => {
    const request = ++latestBooksRequest;
    set({ booksLoading: true, booksError: null });
    try {
      const books = await loadBooks(language);
      if (request !== latestBooksRequest) return false;
      set({ books, booksLoaded: true, booksLoading: false });
      return true;
    } catch (error) {
      if (request !== latestBooksRequest) return false;
      set({ booksLoading: false, booksError: errorMessage(error, '加载书卷信息失败') });
      console.error('加载书卷信息失败:', error);
      throw error;
    }
  },
}));
