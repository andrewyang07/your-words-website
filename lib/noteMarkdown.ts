import type { VerseReference } from './verseParser';

export interface InsertableVerse {
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export function buildInsertedVerseMarkdown(verses: InsertableVerse[]): string {
    return verses
        .map((verse) => `\n> ${verse.book}${verse.chapter}:${verse.verse}: ${verse.text}\n`)
        .join('');
}

export function getInsertionToast(kind: 'chapter' | 'ocr', count: number, insertedInEditor: boolean): string {
    if (kind === 'ocr') {
        return insertedInEditor
            ? `已插入 ${count} 条 OCR 引用`
            : `已添加 ${count} 条 OCR 引用到笔记末尾`;
    }

    return insertedInEditor
        ? `已插入 ${count} 節經文`
        : `已添加 ${count} 節到筆記末尾`;
}

export function uniqueVerseReferences(references: VerseReference[]): VerseReference[] {
    const seen = new Set<string>();
    return references.filter((ref) => {
        const key = `${ref.book}-${ref.chapter}-${ref.startVerse}-${ref.endVerse ?? ref.startVerse}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
