import { create } from 'zustand';
import { VerseState } from '@/types/store';
import { loadPresetVerses, loadChapterVerses, loadBooks } from '@/lib/dataLoader';

export const useVerseStore = create<VerseState>((set, get) => ({
  // 初始状态
  verses: [],
  books: [],
  filteredVerses: [],
  versesLoaded: false,
  booksLoaded: false,

  // Actions
  setVerses: (verses) => set({ verses, filteredVerses: verses, versesLoaded: true }),
  setBooks: (books) => set({ books, booksLoaded: true }),
  setFilteredVerses: (filteredVerses) => set({ filteredVerses }),

  // 加载经文数据
  loadVerses: async (mode, language) => {
    try {
      if (mode === 'preset') {
        const verses = await loadPresetVerses(language);
        get().setVerses(verses);
      }
      // chapter 模式在选择书卷章节时动态加载
    } catch (error) {
      console.error('加载经文失败:', error);
      throw error;
    }
  },

  // 加载书卷信息
  loadBooks: async () => {
    try {
      const books = await loadBooks();
      get().setBooks(books);
    } catch (error) {
      console.error('加载书卷信息失败:', error);
      throw error;
    }
  },
}));

