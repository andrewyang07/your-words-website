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
    /** True while the most recent loadVerses/loadBooks request is still pending. */
    versesLoading: boolean;
    booksLoading: boolean;
    /** Set only when the most recent request failed (stale failures are ignored). */
    versesError: string | null;
    booksError: string | null;

    setVerses: (verses: Verse[]) => void;
    setBooks: (books: Book[]) => void;
    setFilteredVerses: (verses: Verse[]) => void;
    /** Resolves true when this call's result was applied, false when a newer request superseded it. */
    loadVerses: (mode: 'preset' | 'chapter', language: Language) => Promise<boolean>;
    loadBooks: (language?: Language) => Promise<boolean>;
}

