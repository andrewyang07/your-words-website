'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { loadBooks, loadChapterVerses, loadPresetVerses } from '@/lib/dataLoader';
import { getSearchEngine } from '@/lib/search/searchEngine';
import type { Book, Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import DiscoveryVerseCard from './DiscoveryVerseCard';
import {
  getChapterOptions,
  getVerseReference,
  searchResultToVerse,
  type DiscoveryMode,
} from './discoveryHelpers';

const SEARCH_HINTS = ['约3:16', 'Romans 8:28', '平安', 'love'];

export default function DiscoveryPageClient() {
  const { language } = useAppStore();
  const { addFavorite, isFavorite } = useFavoritesStore();
  const [mode, setMode] = useState<DiscoveryMode>('curated');
  const [books, setBooks] = useState<Book[]>([]);
  const [curated, setCurated] = useState<Verse[]>([]);
  const [results, setResults] = useState<Verse[]>([]);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [selectedBookKey, setSelectedBookKey] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const [nextCurated, nextBooks] = await Promise.all([loadPresetVerses(language), loadBooks(language)]);
        if (cancelled) return;
        setCurated(nextCurated);
        setBooks(nextBooks);
        setSelectedBookKey(nextBooks[0]?.key ?? '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载发现页失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const selectedBook = useMemo(() => books.find((book) => book.key === selectedBookKey) ?? null, [books, selectedBookKey]);
  const chapterOptions = useMemo(() => getChapterOptions(selectedBook), [selectedBook]);
  const visibleVerses = mode === 'search' ? results : mode === 'browse' ? chapterVerses : curated;

  useEffect(() => {
    if (!selectedBook || mode !== 'browse') return;
    let cancelled = false;
    const bookKey = selectedBook.key;

    async function loadChapter() {
      setBusy(true);
      setError(null);
      try {
        const nextVerses = await loadChapterVerses(bookKey, selectedChapter, language);
        if (!cancelled) setChapterVerses(nextVerses);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载章节失败');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    loadChapter();
    return () => {
      cancelled = true;
    };
  }, [language, mode, selectedBook, selectedChapter]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setMode('search');
    setBusy(true);
    setError(null);

    try {
      const engine = getSearchEngine();
      if (!engine.initialized) await engine.initialize();
      const found = await engine.search(trimmed);
      setResults(found.slice(0, 24).map(searchResultToVerse));
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function handleSave(verse: Verse) {
    addFavorite(verse.id);
    setToast(`${getVerseReference(verse)} 已加入复习`);
  }

  if (loading) return <LoadingSpinner />;
  if (error && !busy && visibleVerses.length === 0) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <main className="min-h-screen bg-[#f8f5ee] text-stone-950 dark:bg-[#0e1116] dark:text-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded border border-stone-900/10 bg-white/70 px-3 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-stone-200">
            <ArrowLeft className="h-4 w-4" />
            返回复习
          </Link>
          <Link href="/review" className="min-h-[44px] rounded bg-stone-950 px-4 py-3 text-sm text-white dark:bg-stone-50 dark:text-stone-950">
            今日复习
          </Link>
        </header>

        <section className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">发现页</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">发现并保存经文</h1>
        </section>

        <section className="mb-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSearch} className="rounded-lg border border-stone-900/10 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.045]">
            <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">搜索经文或引用</label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={SEARCH_HINTS.join(' · ')}
                className="h-11 min-w-0 flex-1 rounded border border-stone-900/10 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-stone-800 dark:border-white/10 dark:bg-white/[0.06] dark:focus:ring-stone-200"
              />
              <button className="inline-flex h-11 items-center gap-2 rounded bg-stone-950 px-4 text-sm text-white dark:bg-stone-50 dark:text-stone-950">
                <Search className="h-4 w-4" />
                搜索
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-stone-900/10 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.045]">
            <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">按书卷章节浏览</label>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <select
                value={selectedBookKey}
                onChange={(event) => {
                  setSelectedBookKey(event.target.value);
                  setSelectedChapter(1);
                }}
                className="h-11 min-w-0 rounded border border-stone-900/10 bg-white px-2 text-sm dark:border-white/10 dark:bg-[#15191f]"
              >
                {books.map((book) => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
              </select>
              <select value={selectedChapter} onChange={(event) => setSelectedChapter(Number(event.target.value))} className="h-11 rounded border border-stone-900/10 bg-white px-2 text-sm dark:border-white/10 dark:bg-[#15191f]">
                {chapterOptions.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
              <button onClick={() => setMode('browse')} className="inline-flex h-11 items-center gap-2 rounded border border-stone-900/10 px-3 text-sm dark:border-white/10">
                <BookOpen className="h-4 w-4" />
                浏览
              </button>
            </div>
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(['curated', 'search', 'browse'] as DiscoveryMode[]).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`min-h-[40px] rounded border px-3 text-sm ${
                  mode === item
                    ? 'border-stone-950 bg-stone-950 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-950'
                    : 'border-stone-900/10 bg-white/60 text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200'
                }`}
              >
                {item === 'curated' ? '精选' : item === 'search' ? '搜索结果' : '章节'}
              </button>
            ))}
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">{busy ? '加载中...' : `${visibleVerses.length} 节`}</p>
        </div>

        {error && <p className="mb-4 rounded border border-amber-700/20 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">{error}</p>}
        {toast && <p className="mb-4 rounded border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">{toast}</p>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleVerses.map((verse) => (
            <DiscoveryVerseCard key={verse.id} verse={verse} saved={isFavorite(verse.id)} onSave={handleSave} />
          ))}
        </section>

        {visibleVerses.length === 0 && !busy && (
          <p className="rounded-lg border border-stone-900/10 bg-white/65 p-6 text-center text-stone-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
            暂无结果，试试搜索引用或浏览章节。
          </p>
        )}

        <footer className="mt-12 border-t border-stone-900/10 pt-5 text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
          心版 App：更完整的背诵体验。
        </footer>
      </div>
    </main>
  );
}
