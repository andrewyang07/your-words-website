// 核心经文类型定义

export type Testament = 'old' | 'new';
export type Language = 'simplified' | 'traditional';
export type SortBy = 'order' | 'random' | 'priority';

// 经文接口
export interface Verse {
    id: string;
    book: string;
    bookKey: string; // 用于数据查找的英文key
    chapter: number;
    verse: number;
    text: string;
    testament: Testament;
    priority?: number; // 1-5，用于预设模式排序
}

// 书卷接口
export interface Book {
    id?: string; // ID，通常与 key 相同
    key: string; // 书卷key，如"创世记"
    name: string; // 当前语言的名称
    nameTraditional: string; // 繁体中文
    nameSimplified: string; // 简体中文
    nameEnglish: string; // 英文名
    testament: Testament;
    chapters: number; // 章节数
    order: number; // 圣经顺序
}

// 预设经文引用（用于生成preset-verses.json）
export interface VerseReference {
    book: string;
    chapter: number;
    verse: number | number[]; // 可以是单节或多节
    priority?: number;
}
