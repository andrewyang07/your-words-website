'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '@/stores/useSearchStore';
import { getSearchEngine } from '@/lib/search/searchEngine';

const PLACEHOLDER_EXAMPLES = [
  '约3:16 · John 3:16 · 永生 · love',
  '创1:1 · Genesis 1 · 信心 · grace',
  'Ps 23 · 诗篇23 · David · 平安',
];

interface SearchBoxProps {
  variant?: 'hero' | 'compact';
  autoFocus?: boolean;
}

export default function SearchBox({ variant = 'hero', autoFocus = true }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholderIndexRef = useRef(0);

  const {
    query,
    setQuery,
    setResults,
    setLoading,
    setEngineReady,
    selectedIndex,
    setSelectedIndex,
    results,
    clearSearch,
    engineReady,
  } = useSearchStore();

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      placeholderIndexRef.current =
        (placeholderIndexRef.current + 1) % PLACEHOLDER_EXAMPLES.length;
      if (inputRef.current && !query) {
        inputRef.current.placeholder =
          PLACEHOLDER_EXAMPLES[placeholderIndexRef.current];
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [query]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const engine = getSearchEngine();
        if (!engine.initialized) {
          await engine.initialize();
          setEngineReady(true);
        }
        const results = await engine.search(searchQuery);
        setResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [setResults, setLoading]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!value.trim()) {
        setResults([]);
        return;
      }

      // Detect if likely a reference (contains digits after text) → immediate
      const isReference = /[a-zA-Z\u4e00-\u9fff]\s*\d/.test(value);
      const delay = isReference ? 0 : 150;

      timerRef.current = setTimeout(() => {
        performSearch(value);
      }, delay);
    },
    [setQuery, setResults, performSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, -1));
      } else if (e.key === 'Escape') {
        clearSearch();
        inputRef.current?.focus();
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        // Copy selected result
        const result = results[selectedIndex];
        if (result) {
          const text = `${result.bookKey} ${result.chapter}:${result.verse} ${result.textChinese}`;
          navigator.clipboard.writeText(text).catch(() => {});
        }
      }
    },
    [selectedIndex, results, setSelectedIndex, clearSearch]
  );

  return (
    <div
      className={`relative w-full mx-auto ${
        variant === 'hero' ? 'max-w-2xl' : 'max-w-3xl'
      }`}
    >
      <div className="relative flex items-center">
        <Search
          className={`absolute pointer-events-none text-stone-400 dark:text-stone-500 ${
            variant === 'hero' ? 'left-4 w-5 h-5' : 'left-4 w-4 h-4'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER_EXAMPLES[0]}
          className={`w-full border bg-white dark:bg-gray-800 text-stone-950 dark:text-stone-50 placeholder:text-bible-400 dark:placeholder:text-gray-500 focus:outline-none transition-all font-chinese ${
            variant === 'hero'
              ? 'pl-12 pr-10 py-4 text-lg rounded-full border-bible-200 dark:border-gray-700 shadow-sm hover:shadow-md focus:shadow-md focus:border-bible-400 dark:focus:border-bible-500'
              : 'pl-11 pr-10 py-3 text-base rounded-full border-bible-200 dark:border-gray-700 hover:shadow-sm focus:border-bible-400 dark:focus:border-bible-500 focus:shadow-sm'
          }`}
        />
        {query && (
          <button
            onClick={() => {
              clearSearch();
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-full hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="清除搜索"
          >
            <X className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          </button>
        )}
      </div>
      {!engineReady && (
        <p className="mt-2 text-center text-sm text-stone-500 dark:text-stone-400 font-chinese">
          正在准备搜索引擎，您可以直接输入，完成后会自动搜索...
        </p>
      )}
    </div>
  );
}
