// 搜索功能类型定义

export interface SearchResult {
  id: string; // e.g. "创世记-1-1"
  bookKey: string; // Chinese book name (key in CUV_bible.json)
  bookTraditional: string; // Traditional Chinese book name
  bookEnglish: string; // English book name (key in WEB_bible.json)
  chapter: number;
  verse: number;
  textChinese: string;
  textEnglish: string;
  score: number;
  matchType: 'reference' | 'keyword';
}

export interface ContextVerse {
  bookKey: string;
  bookEnglish: string;
  chapter: number;
  verse: number;
  textChinese: string;
  textEnglish: string;
  isCurrent: boolean;
}

export interface BibleData {
  chinese: Record<string, Record<string, Record<string, string>>>;
  english: Record<string, Record<string, Record<string, string>>>;
}

export interface BookMapping {
  key: string; // Chinese name
  nameEnglish: string;
}
