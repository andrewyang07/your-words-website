import { create } from 'zustand';
import { FilterState } from '@/types/store';

export const useFilterStore = create<FilterState>((set) => ({
  // 初始状态
  testament: 'all',
  selectedBooks: [],
  sortBy: 'order',
  selectedBook: null,
  selectedChapter: null,

  // Actions
  setTestament: (testament) => set({ testament }),
  
  toggleBook: (book) =>
    set((state) => ({
      selectedBooks: state.selectedBooks.includes(book)
        ? state.selectedBooks.filter((b) => b !== book)
        : [...state.selectedBooks, book],
    })),
    
  clearBooks: () => set({ selectedBooks: [] }),
  
  setSortBy: (sortBy) => set({ sortBy }),
  
  setSelectedBook: (selectedBook) => set({ selectedBook }),
  
  setSelectedChapter: (selectedChapter) => set({ selectedChapter }),
  
  resetFilters: () =>
    set({
      testament: 'all',
      selectedBooks: [],
      sortBy: 'order',
      selectedBook: null,
      selectedChapter: null,
    }),
}));

