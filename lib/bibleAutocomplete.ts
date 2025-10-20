// 圣经经文自动补全逻辑

import { getStandardBookName } from './verseParser';

export interface AutocompleteOption {
    label: string; // 显示文本
    value: string; // 插入值
    type: 'book' | 'chapter' | 'verse'; // 类型
}

interface Book {
    key: string;
    nameSimplified: string;
    nameTraditional: string;
    nameEnglish: string;
    chapters: number;
}

let booksData: Book[] | null = null;

/**
 * 加载书卷数据
 */
async function loadBooks(): Promise<Book[]> {
    if (booksData) {
        return booksData;
    }

    try {
        const response = await fetch('/data/books.json');
        if (!response.ok) {
            throw new Error('Failed to load books data');
        }
        const data = await response.json();
        booksData = data.books;
        return booksData || [];
    } catch (error) {
        console.error('Error loading books:', error);
        return [];
    }
}

/**
 * 根据输入文本生成自动补全建议
 */
export async function getAutocompleteSuggestions(
    input: string,
    language: 'simplified' | 'traditional' = 'traditional'
): Promise<AutocompleteOption[]> {
    const books = await loadBooks();

    // 解析输入内容
    const match = input.match(/^([^0-9：:]+)(\d*)[:：]?(\d*)$/);
    if (!match) {
        return [];
    }

    const [_, bookPart, chapterPart, versePart] = match;

    // 场景 1: 只输入了书卷名（如 "马太"）
    if (bookPart && !chapterPart) {
        return suggestBooksWithChapters(bookPart.trim(), books, language);
    }

    // 场景 2: 输入了书卷+章节（如 "马太福音3"）
    if (bookPart && chapterPart && !versePart) {
        const book = findBook(bookPart.trim(), books);
        if (!book) {
            return [];
        }
        return suggestVersesForChapter(book, parseInt(chapterPart, 10), language);
    }

    return [];
}

/**
 * 建议书卷+章节
 * 例如：输入 "马太" → 返回 ["马太福音 1", "马太福音 2", ...]
 */
function suggestBooksWithChapters(
    bookInput: string,
    books: Book[],
    language: 'simplified' | 'traditional'
): AutocompleteOption[] {
    const matchedBooks = books.filter((book) => {
        const name = language === 'simplified' ? book.nameSimplified : book.nameTraditional;
        return (
            name.includes(bookInput) ||
            book.nameEnglish.toLowerCase().includes(bookInput.toLowerCase())
        );
    });

    const options: AutocompleteOption[] = [];

    for (const book of matchedBooks) {
        const bookName = language === 'simplified' ? book.nameSimplified : book.nameTraditional;

        // 为每一章生成一个选项（限制最多显示前 10 章）
        const maxChapters = Math.min(book.chapters, 10);
        for (let chapter = 1; chapter <= maxChapters; chapter++) {
            options.push({
                label: `${bookName} ${chapter}`,
                value: `${bookName}${chapter}:`,
                type: 'chapter',
            });
        }

        // 如果章节数超过 10，添加一个提示
        if (book.chapters > 10) {
            options.push({
                label: `${bookName} ... (共 ${book.chapters} 章)`,
                value: `${bookName}`,
                type: 'book',
            });
        }
    }

    return options.slice(0, 20); // 限制最多 20 个建议
}

/**
 * 建议章节内的经文节数
 * 例如：输入 "马太福音3" → 返回 ["马太福音3:1", "马太福音3:2", ...]
 */
function suggestVersesForChapter(
    book: Book,
    chapter: number,
    language: 'simplified' | 'traditional'
): AutocompleteOption[] {
    const bookName = language === 'simplified' ? book.nameSimplified : book.nameTraditional;

    // 由于我们不知道每章有多少节，先假设最多 50 节
    // 实际使用时可以从 CUVT_bible.json 动态加载
    const maxVerses = 50;
    const options: AutocompleteOption[] = [];

    for (let verse = 1; verse <= Math.min(maxVerses, 20); verse++) {
        options.push({
            label: `${bookName} ${chapter}:${verse}`,
            value: `${bookName}${chapter}:${verse}`,
            type: 'verse',
        });
    }

    return options;
}

/**
 * 查找匹配的书卷
 */
function findBook(bookInput: string, books: Book[]): Book | null {
    return (
        books.find(
            (book) =>
                book.nameSimplified === bookInput ||
                book.nameTraditional === bookInput ||
                book.nameSimplified.includes(bookInput) ||
                book.nameTraditional.includes(bookInput)
        ) || null
    );
}

/**
 * 检测光标位置是否在经文引用中
 */
export function isInVerseReference(text: string, cursorPosition: number): boolean {
    // 向前查找，直到遇到空白字符或开头
    let start = cursorPosition;
    while (start > 0 && !/\s/.test(text[start - 1])) {
        start--;
    }

    // 向后查找，直到遇到空白字符或结尾
    let end = cursorPosition;
    while (end < text.length && !/\s/.test(text[end])) {
        end++;
    }

    const word = text.slice(start, end);

    // 检查是否匹配经文引用格式
    return /^[^0-9\s]+\d*[:：]?\d*$/.test(word);
}

/**
 * 提取光标位置的部分引用文本
 */
export function extractPartialReference(text: string, cursorPosition: number): string {
    let start = cursorPosition;
    while (start > 0 && !/[\s,，。！？；：]/.test(text[start - 1])) {
        start--;
    }

    return text.slice(start, cursorPosition);
}

