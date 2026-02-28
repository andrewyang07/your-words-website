'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HelpCircle, Menu } from 'lucide-react';
import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import { getSearchEngine } from '@/lib/search/searchEngine';
import SideMenu from '@/components/navigation/SideMenu';
import SearchBox from '@/components/search/SearchBox';
import SearchResults from '@/components/search/SearchResults';
import LanguageToggle from '@/components/search/LanguageToggle';
import ContextViewer from '@/components/search/ContextViewer';
import SearchHelp from '@/components/search/SearchHelp';

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    setQuery,
    setEngineReady,
    engineReady,
    setResults,
    setLoading,
    results,
    query,
    loading,
  } = useSearchStore();
  const { theme, setTheme, language, setLanguage } = useAppStore();

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [queryHydrated, setQueryHydrated] = useState(false);

  // Initialize search engine and hydrate from ?q=
  useEffect(() => {
    let cancelled = false;
    const engine = getSearchEngine();
    const q = (searchParams.get('q') || '').trim();

    async function init() {
      try {
        if (!engineReady) {
          await engine.initialize();
          if (!cancelled) setEngineReady(true);
        }

        if (!cancelled && q) {
          setQuery(q);
          setLoading(true);
          const searched = await engine.search(q);
          if (!cancelled) {
            setResults(searched);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to initialize search engine:', error);
        if (!cancelled) setLoading(false);
      } finally {
        if (!cancelled) setQueryHydrated(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync query to URL after initial hydration.
  useEffect(() => {
    if (!queryHydrated) return;

    const currentQ = (searchParams.get('q') || '').trim();
    const trimmed = query.trim();

    if (trimmed === currentQ) return;

    const nextUrl = trimmed
      ? `/search?q=${encodeURIComponent(trimmed)}`
      : '/search';
    router.replace(nextUrl, { scroll: false });
  }, [query, queryHydrated, router, searchParams]);

  const isHomeMode = useMemo(
    () => !query.trim() && results.length === 0 && !loading,
    [loading, query, results.length]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-bible-50 to-white dark:from-gray-950 dark:to-gray-900 transition-colors">
      <SideMenu
        isOpen={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        theme={theme}
        onThemeChange={setTheme}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Top utility bar */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-bible-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200 font-chinese transition-colors"
          >
            {language === 'traditional' ? '返回背誦頁' : '返回背诵页'}
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            <button
              onClick={() => setShowHelpPanel(!showHelpPanel)}
              className="h-11 px-3 md:px-4 inline-flex items-center gap-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
              aria-label="切换搜索帮助"
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
              <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                {language === 'traditional' ? '說明' : '说明'}
              </span>
            </button>
            <button
              onClick={() => setShowSideMenu(true)}
              className="h-11 px-3 md:px-4 inline-flex items-center justify-center bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
              aria-label="打开菜单"
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div
            className={`${
              isHomeMode
                ? 'max-w-3xl mx-auto min-h-[65vh] flex flex-col items-center justify-center pt-8'
                : 'sticky top-[73px] z-[9] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-3 border-b border-bible-200 dark:border-gray-700'
            }`}
          >
            {isHomeMode && (
              <>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-bible-800 dark:text-bible-200 mb-3 font-chinese">
                  {language === 'traditional' ? '聖經搜索' : '圣经搜索'}
                </h1>
                <p className="text-sm text-bible-600 dark:text-bible-400 mb-8 font-chinese text-center">
                  {language === 'traditional'
                    ? '支持經文引用、關鍵詞、拼音搜索'
                    : '支持经文引用、关键词、拼音搜索'}
                </p>
              </>
            )}

            <SearchBox variant={isHomeMode ? 'hero' : 'compact'} autoFocus />

            <div
              className={`mt-3 flex items-center ${
                isHomeMode ? 'justify-center md:hidden' : 'justify-end md:hidden'
              }`}
            >
              <LanguageToggle />
            </div>
          </div>

          {isHomeMode ? (
            <div className="max-w-2xl mx-auto mt-6">
              <details className="w-full rounded-xl border border-bible-200 dark:border-gray-700 bg-bible-50/70 dark:bg-gray-800/70 px-4 py-3">
                <summary className="cursor-pointer text-sm text-bible-600 dark:text-bible-300 font-chinese">
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

      <ContextViewer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
