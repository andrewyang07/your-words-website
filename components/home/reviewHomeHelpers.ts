import type { Book, Verse } from '../../types/verse';

export type SavedSortMode = 'bible' | 'random';

export const SHARE_VERSE_LIMIT = 200;

export const STARTER_SUGGESTION_BATCHES = [
    ['约翰福音-3-16', '诗篇-23-1', '罗马书-8-28'],
    ['箴言-3-5', '腓立比书-4-13', '希伯来书-11-1'],
    ['马太福音-11-28', '以赛亚书-40-31', '约翰一书-4-19'],
];

export function parseSavedVerseId(id: string): { bookKey: string; chapter: number; verse: number } | null {
    const parts = id.split('-');
    if (parts.length < 3) return null;

    const verse = Number(parts.at(-1));
    const chapter = Number(parts.at(-2));
    const bookKey = parts.slice(0, -2).join('-');

    if (!bookKey || !Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
    return { bookKey, chapter, verse };
}

export function getVerseBibleOrder(verse: Verse, books: Book[]): number {
    return books.find((book) => book.key === verse.bookKey || book.key === verse.book || book.nameTraditional === verse.book)?.order ?? 999;
}

export function sortSavedVerses(verses: Verse[], books: Book[], mode: SavedSortMode, randomSeed = 0): Verse[] {
    const sorted = [...verses].sort((a, b) => {
        const bookDiff = getVerseBibleOrder(a, books) - getVerseBibleOrder(b, books);
        if (bookDiff !== 0) return bookDiff;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });

    if (mode === 'bible') return sorted;

    return sorted
        .map((verse) => ({ verse, rank: seededRank(`${verse.id}:${randomSeed}`) }))
        .sort((a, b) => a.rank - b.rank)
        .map(({ verse }) => verse);
}

export function toggleSelection(selected: string[], id: string): string[] {
    return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

export function canShareVerseCount(count: number): boolean {
    return count > 0 && count <= SHARE_VERSE_LIMIT;
}

export function nextStarterBatchIndex(current: number, total = STARTER_SUGGESTION_BATCHES.length): number {
    return total <= 0 ? 0 : (current + 1) % total;
}

function seededRank(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
