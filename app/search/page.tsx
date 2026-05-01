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
      <header className="sticky top-0 z-10 border-b border-stone-900/10 bg-[#f8f5ee]/72 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0e1116]/72">
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
              aria-label="切换搜索帮助"
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-stone-700 dark:text-stone-300" />
              <span className="hidden sm:inline font-chinese text-stone-700 dark:text-stone-300 text-sm">
                {language === 'traditional' ? '說明' : '说明'}
              </span>
            </button>
            <button
              onClick={() => setShowSideMenu(true)}
              className="liquid-button inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
              aria-label="打开菜单"
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
                : 'sticky top-[73px] z-[9] border-b border-stone-900/10 bg-[#f8f5ee]/88 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f14]/88'
            }`}
          >
            {isHomeMode && (
              <>
                <h1 className="mb-3 font-chinese text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-50 sm:text-5xl">
                  {language === 'traditional' ? '聖經搜索' : '圣经搜索'}
                </h1>
                <p className="mb-8 text-center font-chinese text-sm text-stone-600 dark:text-stone-400">
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
