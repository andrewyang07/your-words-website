// 经文内容加载工具（带缓存）

interface BibleData {
    [bookName: string]: {
        [chapter: string]: {
            [verse: string]: string;
        };
    };
}

// 内存缓存
const bibleCache = new Map<string, BibleData>();
let fullBibleData: BibleData | null = null;

/**
 * 加载完整圣经数据
 */
async function loadFullBible(): Promise<BibleData> {
    if (fullBibleData) {
        return fullBibleData;
    }

    try {
        const response = await fetch('/data/CUVT_bible.json');
        if (!response.ok) {
            throw new Error('Failed to load Bible data');
        }
        const data = await response.json();
        fullBibleData = data;
        return data;
    } catch (error) {
        console.error('Error loading Bible data:', error);
        throw error;
    }
}

/**
 * 获取单节经文内容
 */
export async function getVerseText(
    book: string,
    chapter: number,
    verse: number
): Promise<string | null> {
    try {
        const data = await loadFullBible();
        return data[book]?.[chapter]?.[verse] || null;
    } catch (error) {
        console.error(`Error getting verse ${book} ${chapter}:${verse}:`, error);
        return null;
    }
}

/**
 * 获取经文范围内容
 */
export async function getVerseRange(
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number
): Promise<Record<number, string>> {
    try {
        const data = await loadFullBible();
        const chapterData = data[book]?.[chapter];

        if (!chapterData) {
            return {};
        }

        const result: Record<number, string> = {};
        for (let v = startVerse; v <= endVerse; v++) {
            if (chapterData[v]) {
                result[v] = chapterData[v];
            }
        }

        return result;
    } catch (error) {
        console.error(`Error getting verse range ${book} ${chapter}:${startVerse}-${endVerse}:`, error);
        return {};
    }
}

/**
 * 获取整章经文
 */
export async function getChapter(
    book: string,
    chapter: number
): Promise<Record<number, string>> {
    try {
        const data = await loadFullBible();
        const chapterData = data[book]?.[chapter];

        if (!chapterData) {
            return {};
        }

        // 转换为 Record<number, string> 格式
        const result: Record<number, string> = {};
        for (const [verseStr, text] of Object.entries(chapterData)) {
            result[parseInt(verseStr, 10)] = text;
        }

        return result;
    } catch (error) {
        console.error(`Error getting chapter ${book} ${chapter}:`, error);
        return {};
    }
}

/**
 * 预加载常用书卷（可选，用于性能优化）
 */
export async function preloadCommonBooks(bookNames: string[]): Promise<void> {
    try {
        await loadFullBible();
        // 数据已经全部加载到内存，无需额外处理
    } catch (error) {
        console.error('Error preloading books:', error);
    }
}

/**
 * 清除缓存
 */
export function clearCache(): void {
    bibleCache.clear();
    fullBibleData = null;
}

