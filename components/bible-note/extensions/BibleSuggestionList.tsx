'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { SuggestionItem } from '@/lib/editorSearch';

export interface BibleSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface BibleSuggestionListProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  isLoading?: boolean;
}

const BibleSuggestionList = forwardRef<BibleSuggestionListRef, BibleSuggestionListProps>(
  ({ items, command, isLoading }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      if (listRef.current) {
        const el = listRef.current.children[selectedIndex] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
      }
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) {
            command(items[selectedIndex]);
          }
          return true;
        }
        return false;
      },
    }));

    if (isLoading) {
      return (
        <div className="w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 p-3">
          <p className="text-sm text-bible-500 dark:text-bible-400 font-chinese animate-pulse">
            搜索引擎加载中…
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 p-3">
          <p className="text-sm text-bible-500 dark:text-bible-400 font-chinese">
            未找到匹配经文
          </p>
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className="w-80 max-h-72 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 py-1"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => command(item)}
            className={`w-full text-left px-3 py-2 transition-colors ${
              index === selectedIndex
                ? 'bg-bible-100 dark:bg-gray-700'
                : 'hover:bg-bible-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="text-sm font-medium text-bible-800 dark:text-bible-200 font-chinese">
              {item.label}
            </div>
            <div className="text-xs text-bible-500 dark:text-bible-400 font-chinese mt-0.5 line-clamp-2">
              {item.preview}
            </div>
          </button>
        ))}
      </div>
    );
  }
);

BibleSuggestionList.displayName = 'BibleSuggestionList';

export default BibleSuggestionList;
