// 通用工具函数

import { Verse } from '@/types/verse';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化经文引用
export function formatVerseReference(verse: Verse): string {
  return `${verse.book} ${verse.chapter}:${verse.verse}`;
}

// 随机打乱数组
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 根据优先级排序经文
export function sortByPriority(verses: Verse[]): Verse[] {
  return [...verses].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });
}

// 根据圣经顺序排序经文
export function sortByOrder(verses: Verse[]): Verse[] {
  return [...verses].sort((a, b) => {
    // 简单比较：先比较书卷名，再比较章节，最后比较节次
    if (a.book !== b.book) {
      return a.book.localeCompare(b.book, 'zh-CN');
    }
    if (a.chapter !== b.chapter) {
      return a.chapter - b.chapter;
    }
    return a.verse - b.verse;
  });
}

// 筛选经文
export function filterVerses(
  verses: Verse[],
  filters: {
    testament?: 'all' | 'old' | 'new';
    books?: string[];
  }
): Verse[] {
  let filtered = verses;

  if (filters.testament && filters.testament !== 'all') {
    filtered = filtered.filter((v) => v.testament === filters.testament);
  }

  if (filters.books && filters.books.length > 0) {
    filtered = filtered.filter((v) => filters.books!.includes(v.book));
  }

  return filtered;
}

// 根据经文长度确定卡片大小
export function getCardSize(verse: Verse): 'small' | 'medium' | 'large' {
  if (verse.priority && verse.priority >= 5) return 'large';
  if (verse.priority && verse.priority >= 3) return 'medium';
  
  const length = verse.text.length;
  if (length > 100) return 'large';
  if (length > 50) return 'medium';
  return 'small';
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

