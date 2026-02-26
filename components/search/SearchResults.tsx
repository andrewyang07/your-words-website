'use client';

import { useSearchStore } from '@/stores/useSearchStore';
import SearchResultCard from './SearchResultCard';

export default function SearchResults() {
  const { results, selectedIndex, loading, query } = useSearchStore();

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-bible-100 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="h-4 bg-bible-100 dark:bg-gray-800 rounded w-1/3 mb-3" />
            <div className="h-3 bg-bible-50 dark:bg-gray-800/50 rounded w-full mb-2" />
            <div className="h-3 bg-bible-50 dark:bg-gray-800/50 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!query.trim()) return null;

  if (results.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 text-center">
        <p className="text-bible-500 dark:text-bible-400 font-chinese">
          未找到相关经文
        </p>
        <p className="text-sm text-bible-400 dark:text-bible-500 mt-1 font-chinese">
          试试其他关键词，或输入经文引用如 &quot;约3:16&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 space-y-3">
      {results.map((result, index) => (
        <SearchResultCard
          key={result.id}
          result={result}
          index={index}
          isSelected={index === selectedIndex}
        />
      ))}
      {results.length > 0 && (
        <p className="text-center text-xs text-bible-400 dark:text-bible-500 pt-2 font-chinese">
          ↑↓ 导航 · Enter 复制 · Esc 清除
        </p>
      )}
    </div>
  );
}
