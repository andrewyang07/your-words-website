'use client';

import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import SearchResultCard from './SearchResultCard';

interface SearchResultsProps {
  showKeyboardHint?: boolean;
}

export default function SearchResults({ showKeyboardHint = true }: SearchResultsProps) {
  const { results, selectedIndex, loading, query } = useSearchStore();
  const language = useAppStore((s) => s.language);

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-bible-200 dark:border-gray-700 p-5 animate-pulse bg-white dark:bg-gray-800"
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
        <p className="text-sm text-bible-500 dark:text-bible-400 mt-2 font-chinese">
          {language === 'traditional'
            ? '試試其他關鍵詞，或輸入如「約3:16」的經文引用'
            : '试试其他关键词，或输入如“约3:16”的经文引用'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-5 space-y-4">
      <p className="text-xs text-bible-500 dark:text-bible-400 font-chinese px-1">
        {language === 'traditional'
          ? `找到 ${results.length} 條結果`
          : `找到 ${results.length} 条结果`}
      </p>
      {results.map((result, index) => (
        <SearchResultCard
          key={result.id}
          result={result}
          index={index}
          isSelected={index === selectedIndex}
        />
      ))}
      {showKeyboardHint && results.length > 0 && (
        <p className="text-center text-xs text-bible-400 dark:text-bible-500 pt-2 font-chinese">
          ↑↓ 导航 · Enter 复制 · Esc 清除
        </p>
      )}
    </div>
  );
}
