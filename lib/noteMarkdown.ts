import type { VerseReference } from './verseParser';
import type { UiScript } from './uiScript';

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

const INSERTION_TOAST = {
    simplified: {
        chapterInserted: (count: number) => `已插入 ${count} 节经文`,
        chapterAppended: (count: number) => `已添加 ${count} 节到笔记末尾`,
        ocrInserted: (count: number) => `已插入 ${count} 条 OCR 引用`,
        ocrAppended: (count: number) => `已添加 ${count} 条 OCR 引用到笔记末尾`,
    },
    traditional: {
        chapterInserted: (count: number) => `已插入 ${count} 節經文`,
        chapterAppended: (count: number) => `已添加 ${count} 節到筆記末尾`,
        ocrInserted: (count: number) => `已插入 ${count} 條 OCR 引用`,
        ocrAppended: (count: number) => `已添加 ${count} 條 OCR 引用到筆記末尾`,
    },
} as const;

export function getInsertionToast(
    kind: 'chapter' | 'ocr',
    count: number,
    insertedInEditor: boolean,
    language: UiScript = 'traditional'
): string {
    const copy = INSERTION_TOAST[language];
    if (kind === 'ocr') {
        return insertedInEditor ? copy.ocrInserted(count) : copy.ocrAppended(count);
    }
    return insertedInEditor ? copy.chapterInserted(count) : copy.chapterAppended(count);
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
