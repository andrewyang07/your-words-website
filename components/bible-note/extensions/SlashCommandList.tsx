'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BookOpen, Heading, Quote, List, Minus } from 'lucide-react';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: any; range: any }) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  ({ items, command }, ref) => {
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

    if (items.length === 0) return null;

    return (
      <div
        ref={listRef}
        className="w-64 max-h-72 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 py-1"
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            onClick={() => command(item)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-bible-100 dark:bg-gray-700'
                : 'hover:bg-bible-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span className="flex-shrink-0 text-bible-500 dark:text-bible-400">
              {item.icon}
            </span>
            <div>
              <div className="text-sm font-medium text-bible-800 dark:text-bible-200 font-chinese">
                {item.title}
              </div>
              <div className="text-xs text-bible-500 dark:text-bible-400 font-chinese">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

SlashCommandList.displayName = 'SlashCommandList';

export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const items: SlashCommandItem[] = [
    {
      title: '经文搜索',
      description: '搜索并插入经文',
      icon: <BookOpen className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        // Insert @ to trigger bible suggestion
        editor.chain().focus().insertContent('@').run();
      },
    },
    {
      title: '标题',
      description: '大号标题',
      icon: <Heading className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
    },
    {
      title: '引用',
      description: '引用块',
      icon: <Quote className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run();
      },
    },
    {
      title: '列表',
      description: '无序列表',
      icon: <List className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: '分割线',
      description: '水平分割线',
      icon: <Minus className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];

  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (q === 'v' || q === 'verse' || q === '经文' ? item.title === '经文搜索' : false)
  );
}

export default SlashCommandList;
