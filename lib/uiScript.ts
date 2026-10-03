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
  if (!book) return '未知';

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

export function getTestamentLabel(
  testament: 'old' | 'new' | string | null | undefined,
  language: UiScript
): string {
  if (testament === 'old') {
    return language === 'traditional' ? '舊約' : '旧约';
  }
  return language === 'traditional' ? '新約' : '新约';
}

export const CHROME_COPY = {
  simplified: {
    loadMore: '加载更多',
    blessing: '愿神的话语常在你心中',
    rankingsEmpty: '暂无排行榜数据',
    rankingsEmptyHint: '开始收藏经文吧！',
    notePlaceholder: '开始记录今天的灵修笔记…',
    matchingIndex: '正在匹配经文索引。',
    xinbanPromoPara2:
      '我也为这个 App 付出了大量心血，并让它全球上架。虽然功能很丰富，但对于不太常用手机的基督徒来说可能略显复杂。 因此，我开发了这个更简洁易用的网页版本。',
  },
  traditional: {
    loadMore: '載入更多',
    blessing: '願神的話語常在你心中',
    rankingsEmpty: '暫無排行榜數據',
    rankingsEmptyHint: '開始收藏經文吧！',
    notePlaceholder: '開始記錄今天的靈修筆記…',
    matchingIndex: '正在匹配經文索引。',
    xinbanPromoPara2:
      '我也為這個 App 付出了大量心血，並讓它全球上架。雖然功能很豐富，但對於不太常用手機的基督徒來說可能略顯複雜。 因此，我開發了這個更簡潔易用的網頁版本。',
  },
} as const;

export function getChromeCopy(language: UiScript) {
  return CHROME_COPY[language];
}

/** Pick the string that matches the active UI script (Traditional first, Simplified second). */
export function pickScript(language: UiScript, traditional: string, simplified: string): string {
  return language === 'traditional' ? traditional : simplified;
}

const BRAND_SUFFIX = { traditional: ' | 你的話語', simplified: ' | 你的话语' } as const;

/** Browser-tab title for a page in the given UI script (mirrors the `%s | 你的話語` metadata template). */
export function getDocumentTitle(
  language: UiScript,
  title: { traditional: string; simplified: string },
  absolute = false
): string {
  return `${title[language]}${absolute ? '' : BRAND_SUFFIX[language]}`;
}
