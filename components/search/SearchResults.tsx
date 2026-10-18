'use client';

import { useState } from 'react';
import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import { formatResultCount, isOnlyStopTerms, moreWordsHint } from '@/lib/search/searchHelpers';
import SearchResultCard from './SearchResultCard';

interface SearchResultsProps {
  showKeyboardHint?: boolean;
}

export default function SearchResults({ showKeyboardHint = true }: SearchResultsProps) {
  const { results, resultsTruncated, selectedIndex, loading, fallbackLoading, query, loadMore } = useSearchStore();
  const language = useAppStore((s) => s.language);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pinyin results load only their first fragments; "more" fetches the full merged list for the same query.
  const showMore = async () => {
    if (!loadMore || loadingMore) return;
    const forQuery = useSearchStore.getState().query;
    setLoadingMore(true);
    try {
      const full = await loadMore();
      if (useSearchStore.getState().query === forQuery) {
        useSearchStore.getState().setResults(full.results, full.truncated, full.loadMore);
      }
    } catch {
      // keep the first-screen results
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-6 space-y-4" aria-busy="true">
        <p role="status" className="px-1 text-center text-sm text-stone-600 dark:text-stone-400 font-chinese">
          {language === 'traditional' ? '載入中…' : '加载中…'}
          {fallbackLoading && (
            <span className="mt-1 block text-xs">
              {language === 'traditional' ? '首次搜索需下載經文資料，約需數秒' : '首次搜索需下载经文数据，约需数秒'}
            </span>
          )}
        </p>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-bible-200 dark:border-white/10 p-5 animate-pulse bg-white dark:bg-[#211d17]"
          >
            <div className="h-4 bg-bible-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-3 bg-bible-100 dark:bg-gray-700/70 rounded w-full mb-2" />
            <div className="h-3 bg-bible-100 dark:bg-gray-700/70 rounded w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (!query.trim()) return null;

  if (results.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10 text-center">
        <p className="text-bible-600 dark:text-bible-300 font-chinese">
          {language === 'traditional' ? '未找到相關經文' : '未找到相关经文'}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 font-chinese">
          {isOnlyStopTerms(query)
            ? moreWordsHint(query, language === 'traditional')
            : language === 'traditional'
              ? '試試其他關鍵詞，或輸入如「約3:16」的經文引用'
              : '试试其他关键词，或输入如“约3:16”的经文引用'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-5 space-y-4">
      <p className="text-xs text-stone-500 dark:text-stone-400 font-chinese px-1">
        {formatResultCount(results.length, {
          truncated: resultsTruncated,
          traditional: language === 'traditional',
        })}
      </p>
      {results.map((result, index) => (
        <SearchResultCard key={result.id} result={result} index={index} isSelected={index === selectedIndex} />
      ))}
      {loadMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => void showMore()}
            disabled={loadingMore}
            className="rounded-full border border-bible-200 px-4 py-2 text-sm text-bible-700 font-chinese hover:bg-bible-50 disabled:opacity-60 dark:border-white/10 dark:text-bible-200 dark:hover:bg-white/5"
          >
            {loadingMore
              ? language === 'traditional'
                ? '載入中…'
                : '加载中…'
              : language === 'traditional'
                ? '更多結果'
                : '更多结果'}
          </button>
        </div>
      )}
      {showKeyboardHint && results.length > 0 && (
        <p className="text-center text-xs text-bible-400 dark:text-bible-500 pt-2 font-chinese">
          {language === 'traditional' ? '↑↓ 導航 · Enter 複製 · Esc 清除' : '↑↓ 导航 · Enter 复制 · Esc 清除'}
        </p>
      )}
    </div>
  );
}
