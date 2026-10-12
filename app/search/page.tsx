'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Menu } from 'lucide-react';
import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import { runClientSearch } from '@/lib/search/runClientSearch';
import { clampQuery, detectSearchLangFromQuery } from '@/lib/search/searchHelpers';
import SideMenu from '@/components/navigation/SideMenu';
import SearchBox from '@/components/search/SearchBox';
import SearchResults from '@/components/search/SearchResults';
import LanguageToggle from '@/components/search/LanguageToggle';
import ContextViewer from '@/components/search/ContextViewer';
import SearchHelp from '@/components/search/SearchHelp';

/** Typing settles into a committed search after this long; only committed searches get a history entry. */
const SEARCH_COMMIT_DELAY_MS = 800;

/**
 * Keeps ?q= and the store in sync. It is the only part of /search that needs useSearchParams, so it sits in its
 * own Suspense boundary: the rest of the page is server-rendered instead of bailing out to an empty shell, which
 * used to drop the page in after hydration and shift the layout's footer (CLS ≈ 0.48).
 *
 * - URL → store: initial ?q= and Back/Forward run that search.
 * - store → URL: a committed search (typing paused for SEARCH_COMMIT_DELAY_MS) pushes a history entry, so Back
 *   walks through previous searches; clearing (✕ / Esc / deleting the text) removes ?q= immediately.
 */
function SearchQuerySync() {
  const searchParams = useSearchParams();
  const urlQuery = clampQuery((searchParams.get('q') || '').trim()).trim();
  const query = useSearchStore((state) => state.query);
  const engineReady = useSearchStore((state) => state.engineReady);
  const setEngineReady = useSearchStore((state) => state.setEngineReady);
  // The q value that URL and store currently agree on; null until the URL has been read once.
  const syncedRef = useRef<string | null>(null);
  const urlSearchIdRef = useRef(0);

  useEffect(() => {
    // Pagefind answers queries; MiniSearch is only loaded lazily by runClientSearch when Pagefind fails.
    if (!engineReady) setEngineReady(true);
  }, [engineReady, setEngineReady]);

  // URL → store
  useEffect(() => {
    if (syncedRef.current === urlQuery) return;
    syncedRef.current = urlQuery;
    const store = useSearchStore.getState();
    if (store.query.trim() === urlQuery) return;
    const searchId = ++urlSearchIdRef.current;
    if (!urlQuery) {
      store.clearSearch();
      store.setLoading(false);
      return;
    }
    store.setQuery(urlQuery);
    const langFromQuery = detectSearchLangFromQuery(urlQuery);
    if (langFromQuery) store.setSearchLang(langFromQuery);
    store.setLoading(true);
    void runClientSearch(urlQuery, undefined, {
      onFallbackLoading: () => useSearchStore.getState().setFallbackLoading(true),
    })
      .then(({ results, truncated }) => {
        if (searchId !== urlSearchIdRef.current || useSearchStore.getState().query.trim() !== urlQuery) return;
        useSearchStore.getState().setResults(results, truncated);
      })
      .catch((error: unknown) => console.error('Search from URL failed:', error))
      .finally(() => {
        if (searchId === urlSearchIdRef.current) useSearchStore.getState().setLoading(false);
      });
  }, [urlQuery]);

  // store → URL
  useEffect(() => {
    if (syncedRef.current === null) return;
    const trimmed = clampQuery(query).trim();
    // The URL effect above may have just set a newer query in this same commit; wait for that render.
    if (trimmed !== clampQuery(useSearchStore.getState().query).trim()) return;
    if (trimmed === syncedRef.current) return;
    if (!trimmed) {
      syncedRef.current = '';
      urlSearchIdRef.current += 1;
      window.history.replaceState(null, '', '/search');
      return;
    }
    const timer = setTimeout(() => {
      syncedRef.current = trimmed;
      window.history.pushState(null, '', `/search?q=${encodeURIComponent(trimmed)}`);
    }, SEARCH_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return null;
}

function SearchPageInner() {
  const { results, query, loading } = useSearchStore();
  const { theme, setTheme, language, setLanguage } = useAppStore();

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  const isHomeMode = useMemo(() => !query.trim() && results.length === 0 && !loading, [loading, query, results.length]);

  return (
    <div className="min-h-screen yw-page">
      <SideMenu
        isOpen={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        theme={theme}
        onThemeChange={setTheme}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Top utility bar */}
      <header className="sticky top-0 z-10 border-b border-stone-900/10 bg-[#f8f5ee]/[.72] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0e1116]/[.72]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <Link
            href="/"
            className="font-chinese text-sm text-stone-600 transition-colors hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50"
          >
            {language === 'traditional' ? '返回背誦頁' : '返回背诵页'}
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            <button
              onClick={() => setShowHelpPanel(!showHelpPanel)}
              className="liquid-button inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
              aria-label={language === 'traditional' ? '切換搜索幫助' : '切换搜索帮助'}
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-stone-700 dark:text-stone-300" />
              <span className="hidden sm:inline font-chinese text-stone-700 dark:text-stone-300 text-sm">
                {language === 'traditional' ? '說明' : '说明'}
              </span>
            </button>
            <button
              onClick={() => setShowSideMenu(true)}
              className="liquid-button inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
              aria-label={language === 'traditional' ? '打開選單' : '打开菜单'}
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5 text-stone-700 dark:text-stone-300" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div
            className={`${
              isHomeMode
                ? 'mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center pt-8'
                : 'sticky top-[73px] z-[9] border-b border-stone-900/10 bg-[#f8f5ee]/[.88] py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f14]/[.88]'
            }`}
          >
            {isHomeMode && (
              <>
                <h2 className="mb-3 font-chinese text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-50 sm:text-5xl">
                  {language === 'traditional' ? '聖經搜索' : '圣经搜索'}
                </h2>
                <p className="mb-8 text-center font-chinese text-sm text-stone-600 dark:text-stone-400">
                  {language === 'traditional' ? '支持經文引用、關鍵詞、拼音搜索' : '支持经文引用、关键词、拼音搜索'}
                </p>
              </>
            )}

            <SearchBox variant={isHomeMode ? 'hero' : 'compact'} autoFocus />

            <div
              className={`mt-3 flex items-center ${isHomeMode ? 'justify-center md:hidden' : 'justify-end md:hidden'}`}
            >
              <LanguageToggle />
            </div>
          </div>

          {isHomeMode ? (
            <div className="max-w-2xl mx-auto mt-6">
              <details className="yw-panel w-full px-4 py-3">
                <summary className="cursor-pointer font-chinese text-sm text-stone-600 dark:text-stone-300">
                  {language === 'traditional' ? '查看搜索說明' : '查看搜索说明'}
                </summary>
                <div className="mt-3">
                  <SearchHelp />
                </div>
              </details>
            </div>
          ) : (
            <>
              {showHelpPanel && (
                <div className="mt-4">
                  <SearchHelp />
                </div>
              )}
              <SearchResults />
            </>
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        <SearchQuerySync />
      </Suspense>
      <ContextViewer />
    </div>
  );
}

export default function SearchPage() {
  return <SearchPageInner />;
}
