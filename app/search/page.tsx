'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import { getSearchEngine } from '@/lib/search/searchEngine';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import SearchBox from '@/components/search/SearchBox';
import SearchResults from '@/components/search/SearchResults';
import LanguageToggle from '@/components/search/LanguageToggle';
import ContextViewer from '@/components/search/ContextViewer';
import SearchHelp from '@/components/search/SearchHelp';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const { setQuery, setEngineReady, engineReady, setResults, setLoading, results, query } =
    useSearchStore();
  const { theme, toggleTheme, language, setLanguage } = useAppStore();
  const [showSideMenu, setShowSideMenu] = useState(false);

  // Initialize search engine on mount
  useEffect(() => {
    let cancelled = false;
    const engine = getSearchEngine();

    async function init() {
      try {
        await engine.initialize();
        if (!cancelled) {
          setEngineReady(true);

          // Check for ?q= URL param
          const q = searchParams.get('q');
          if (q) {
            setQuery(q);
            setLoading(true);
            const results = await engine.search(q);
            if (!cancelled) {
              setResults(results);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize search engine:', error);
      }
    }

    if (!engineReady) {
      init();
    } else {
      // Engine already ready, handle ?q= param
      const q = searchParams.get('q');
      if (q) {
        setQuery(q);
        setLoading(true);
        engine.search(q).then((results) => {
          if (!cancelled) {
            setResults(results);
            setLoading(false);
          }
        });
      }
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showHelp = results.length === 0 && !query.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-bible-50 to-white dark:from-gray-950 dark:to-gray-900 transition-colors">
      {/* Unified Header */}
      <PageHeader
        onMenuClick={() => setShowSideMenu(true)}
        showHelp={false}
        subtitle={
          <span className="text-bible-500 dark:text-bible-400 font-medium">
            {language === 'traditional' ? '聖經搜索' : '圣经搜索'}
          </span>
        }
      />

      {/* Side Menu */}
      <SideMenu
        isOpen={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        theme={theme}
        onThemeChange={toggleTheme}
        language={language}
        onLanguageChange={setLanguage}
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
        {/* Language Toggle */}
        <div className="flex justify-center mb-6">
          <LanguageToggle />
        </div>

        {/* Search Box */}
        <SearchBox />

        {/* Search Help - shown when no results and no query */}
        {showHelp && <SearchHelp />}

        {/* Results */}
        <SearchResults />

        {/* Context Viewer Modal */}
        <ContextViewer />
      </div>
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
