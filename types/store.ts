// Zustand Store 类型定义

import { Verse, Book, Language } from './verse';

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

