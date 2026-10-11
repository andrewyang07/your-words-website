'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '@/stores/useSearchStore';
import { runClientSearch } from '@/lib/search/runClientSearch';
import { detectSearchLangFromQuery } from '@/lib/search/searchHelpers';

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
  // Monotonic id of the latest search; responses from older requests are dropped so they can't overwrite newer ones.
  const requestIdRef = useRef(0);
  const placeholderIndexRef = useRef(0);

  const {
    query,
    setQuery,
    setResults,
    setLoading,
    setEngineReady,
    setSearchLang,
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
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % PLACEHOLDER_EXAMPLES.length;
      if (inputRef.current && !query) {
        inputRef.current.placeholder = PLACEHOLDER_EXAMPLES[placeholderIndexRef.current] ?? '';
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [query]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const requestId = ++requestIdRef.current;
      const isCurrent = () => requestId === requestIdRef.current;
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      const langFromQuery = detectSearchLangFromQuery(searchQuery);
      if (langFromQuery) setSearchLang(langFromQuery);

      setLoading(true);
      try {
        // Pagefind first; runClientSearch lazy-loads MiniSearch only if Pagefind fails.
        const { results: searched, truncated } = await runClientSearch(searchQuery, undefined, {
          onFallbackLoading: () => useSearchStore.getState().setFallbackLoading(true),
        });
        if (!isCurrent()) return;
        setResults(searched, truncated);
        setEngineReady(true);
      } catch (error) {
        if (!isCurrent()) return;
        console.error('Search error:', error);
        setResults([]);
      } finally {
        if (isCurrent()) setLoading(false);
      }
    },
    [setResults, setLoading, setEngineReady, setSearchLang],
  );

  // Single cancel-and-clear path for ✕, Escape and deleting the text: invalidates any in-flight search,
  // drops a pending debounce, clears the store and stops the loading state.
  const clear = useCallback(() => {
    requestIdRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearSearch();
    setLoading(false);
  }, [clearSearch, setLoading]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!value.trim()) {
        clear();
        return;
      }

      // Show the loading state right away so the debounce window never flashes 未找到 for the new query.
      setLoading(true);

      // Detect if likely a reference (contains digits after text) → immediate
      const isReference = /[a-zA-Z\u4e00-\u9fff]\s*\d/.test(value);
      const delay = isReference ? 0 : 150;

      timerRef.current = setTimeout(() => {
        void performSearch(value);
      }, delay);
    },
    [setQuery, setLoading, performSearch, clear],
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
        clear();
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
    [selectedIndex, results, setSelectedIndex, clear],
  );

  return (
    <div className={`relative w-full mx-auto ${variant === 'hero' ? 'max-w-2xl' : 'max-w-3xl'}`}>
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
              clear();
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
