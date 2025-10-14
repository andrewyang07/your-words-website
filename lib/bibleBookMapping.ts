/**
 * 圣经书卷ID映射工具
 * 用于将书卷key与数字ID（1-66）相互转换，以支持URL参数的简短编码
 */

import booksData from '@/public/data/books.json';

// 书卷key到ID的映射（1-66）
const bookKeyToId: Record<string, number> = {};
const bookIdToKey: Record<number, string> = {};

// 初始化映射表
booksData.books.forEach((book) => {
    bookKeyToId[book.key] = book.order;
    bookIdToKey[book.order] = book.key;
});

/**
 * 将经文引用编码为短格式字符串
 * @param bookKey 书卷key（如"创世记"）
 * @param chapter 章节号
 * @param verse 节号
 * @returns 编码后的字符串（如"1-3-16"）
 */
export function encodeVerseRef(bookKey: string, chapter: number, verse: number): string {
    const bookId = bookKeyToId[bookKey];
    if (!bookId) {
        throw new Error(`未知的书卷: ${bookKey}`);
    }
    return `${bookId}-${chapter}-${verse}`;
}

/**
 * 将短格式字符串解码为经文引用
 * @param encoded 编码后的字符串（如"1-3-16"）
 * @returns 解码后的对象 {bookKey, chapter, verse}
 */
export function decodeVerseRef(encoded: string): {
    bookKey: string;
    chapter: number;
    verse: number;
} | null {
    const parts = encoded.split('-');
    if (parts.length !== 3) {
        return null;
    }

    const bookId = parseInt(parts[0], 10);
    const chapter = parseInt(parts[1], 10);
    const verse = parseInt(parts[2], 10);

    if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
        return null;
    }

    const bookKey = bookIdToKey[bookId];
    if (!bookKey) {
        return null;
    }

    return { bookKey, chapter, verse };
}

/**
 * 编码多个经文引用为URL参数格式
 * @param verses 经文引用数组
 * @returns URL参数字符串（如"1-3-16,50-4-6"）
 */
export function encodeVerseList(verses: Array<{ bookKey: string; chapter: number; verse: number }>): string {
    return verses.map(v => encodeVerseRef(v.bookKey, v.chapter, v.verse)).join(',');
}

/**
 * 解码URL参数为经文引用数组
 * @param encoded URL参数字符串（如"1-3-16,50-4-6"）
 * @returns 经文引用数组，无效的引用会被过滤掉
 */
export function decodeVerseList(encoded: string): Array<{ bookKey: string; chapter: number; verse: number }> {
    if (!encoded) {
        return [];
    }

    return encoded
        .split(',')
        .map(item => decodeVerseRef(item.trim()))
        .filter((item): item is { bookKey: string; chapter: number; verse: number } => item !== null);
}

/**
 * 导出映射表供其他地方使用
 */
export { bookKeyToId, bookIdToKey };

