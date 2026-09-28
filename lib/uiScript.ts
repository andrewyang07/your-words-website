import type { Language } from '@/types/verse';
import booksData from '@/public/data/books.json';

/**
 * UI 简/繁 script helpers.
 * Distinct from `/search` LanguageToggle (中文/English), which selects Bible corpus
 * language for search results — not product chrome script.
 */

export type UiScript = Language;

type BookNameSource = {
  key?: string;
  name?: string;
  nameSimplified?: string;
  nameTraditional?: string;
};

export function getBookDisplayName(
  book: BookNameSource | string | null | undefined,
  language: UiScript
): string {
  if (!book) return language === 'traditional' ? '未知' : '未知';

  if (typeof book === 'string') {
    const match = booksData.books.find(
      (b) =>
        b.key === book ||
        b.nameSimplified === book ||
        b.nameTraditional === book
    );
    if (!match) return book;
    return language === 'simplified' ? match.nameSimplified : match.nameTraditional;
  }

  if (language === 'simplified') {
    return book.nameSimplified || book.name || book.key || '未知';
  }
  return book.nameTraditional || book.name || book.key || '未知';
}

export function bookMatchesFilter(
  verseBook: string | undefined,
  verseBookKey: string | undefined,
  book: { key: string; name?: string; nameSimplified?: string; nameTraditional?: string }
): boolean {
  const candidates = [
    verseBookKey,
    verseBook,
  ].filter(Boolean) as string[];
  const names = [book.key, book.name, book.nameSimplified, book.nameTraditional].filter(
    Boolean
  ) as string[];
  return candidates.some((c) => names.includes(c));
}

export const MENU_COPY = {
  simplified: {
    menu: '菜单',
    brand: '你的话语',
    memorize: '背经文',
    search: '经文搜索',
    notebook: '笔记本',
    help: '帮助',
    about: '关于',
    appearance: '外观',
    light: '浅色',
    dark: '深色',
    auto: '自动',
    followSystem: '跟随系统外观',
    language: '语言',
    simplifiedLabel: '简体中文',
    traditionalLabel: '繁體中文',
    topFavorites: '全站最多收藏',
    peopleFavorited: '人全站收藏',
    viewRankings: '查看全站排行榜',
    noData: '暂无数据',
    closeMenu: '关闭菜单',
    viewChapter: '查看章节',
    openMenu: '打开菜单',
    menuButton: '菜单',
    homeTitle: '返回首页',
  },
  traditional: {
    menu: '菜單',
    brand: '你的話語',
    memorize: '背經文',
    search: '經文搜索',
    notebook: '筆記本',
    help: '幫助',
    about: '關於',
    appearance: '外觀',
    light: '淺色',
    dark: '深色',
    auto: '自動',
    followSystem: '跟隨系統外觀',
    language: '語言',
    simplifiedLabel: '简体中文',
    traditionalLabel: '繁體中文',
    topFavorites: '全站最多收藏',
    peopleFavorited: '人全站收藏',
    viewRankings: '查看全站排行榜',
    noData: '暫無數據',
    closeMenu: '關閉選單',
    viewChapter: '查看章節',
    openMenu: '打開選單',
    menuButton: '菜單',
    homeTitle: '返回首頁',
  },
} as const;

export function getMenuCopy(language: UiScript) {
  return MENU_COPY[language];
}
