// Zustand Store 类型定义

import { Verse, Book, Testament, SortBy, Language } from './verse';

// 应用状态
export interface AppState {
    currentMode: 'preset' | 'chapter';
    loading: boolean;
    error: string | null;
    language: Language;
    theme: 'light' | 'dark' | 'system';

    setCurrentMode: (mode: 'preset' | 'chapter') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setLanguage: (language: Language) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleTheme: () => void;
}

// 经文数据状态
export interface VerseState {
    verses: Verse[];
    books: Book[];
    filteredVerses: Verse[];
    versesLoaded: boolean;
    booksLoaded: boolean;

    setVerses: (verses: Verse[]) => void;
    setBooks: (books: Book[]) => void;
    setFilteredVerses: (verses: Verse[]) => void;
    loadVerses: (mode: 'preset' | 'chapter', language: Language) => Promise<void>;
    loadBooks: (language?: Language) => Promise<void>;
}

// 筛选状态
export interface FilterState {
    testament: Testament | 'all';
    selectedBooks: string[];
    sortBy: SortBy;
    selectedBook: string | null;
    selectedChapter: number | null;

    setTestament: (testament: Testament | 'all') => void;
    toggleBook: (book: string) => void;
    clearBooks: () => void;
    setSortBy: (sortBy: SortBy) => void;
    setSelectedBook: (book: string | null) => void;
    setSelectedChapter: (chapter: number | null) => void;
    resetFilters: () => void;
}
