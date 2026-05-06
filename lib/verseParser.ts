// 经文引用解析工具
import { bcv_parser } from 'bible-passage-reference-parser/esm/bcv_parser.js';
import * as zhParser from 'bible-passage-reference-parser/esm/lang/zh.js';
import * as enParser from 'bible-passage-reference-parser/esm/lang/en.js';

export interface VerseReference {
    original: string; // 原始文本，如 "约3:16"
    book: string; // 书卷名，如 "约翰福音"
    chapter: number; // 章节号
    startVerse: number; // 起始节号
    endVerse?: number; // 结束节号（如果是范围）
    position: number; // 在文本中的位置
}

// 书卷简称到全称的映射
const BOOK_ABBREVIATIONS: Record<string, string> = {
    // 旧约
    '创': '创世记',
    '出': '出埃及记',
    '利': '利未记',
    '民': '民数记',
    '申': '申命记',
    '书': '约书亚记',
    '士': '士师记',
    '得': '路得记',
    '撒上': '撒母耳记上',
    '撒下': '撒母耳记下',
    '王上': '列王纪上',
    '王下': '列王纪下',
    '代上': '历代志上',
    '代下': '历代志下',
    '拉': '以斯拉记',
    '尼': '尼希米记',
    '斯': '以斯帖记',
    '伯': '约伯记',
    '诗': '诗篇',
    '箴': '箴言',
    '传': '传道书',
    '歌': '雅歌',
    '赛': '以赛亚书',
    '耶': '耶利米书',
    '哀': '耶利米哀歌',
    '结': '以西结书',
    '但': '但以理书',
    '何': '何西阿书',
    '珥': '约珥书',
    '摩': '阿摩司书',
    '俄': '俄巴底亚书',
    '拿': '约拿书',
    '弥': '弥迦书',
    '鸿': '那鸿书',
    '哈': '哈巴谷书',
    '番': '西番雅书',
    '该': '哈该书',
    '亚': '撒迦利亚书',
    '玛': '玛拉基书',
    // 新约
    '太': '马太福音',
    '可': '马可福音',
    '路': '路加福音',
    '约': '约翰福音',
    '徒': '使徒行传',
    '罗': '罗马书',
    '林前': '哥林多前书',
    '林后': '哥林多后书',
    '加': '加拉太书',
    '弗': '以弗所书',
    '腓': '腓立比书',
    '西': '歌罗西书',
    '帖前': '帖撒罗尼迦前书',
    '帖后': '帖撒罗尼迦后书',
    '提前': '提摩太前书',
    '提后': '提摩太后书',
    '多': '提多书',
    '门': '腓利门书',
    '来': '希伯来书',
    '雅': '雅各书',
    '彼前': '彼得前书',
    '彼后': '彼得后书',
    '约一': '约翰一书',
    '约二': '约翰二书',
    '约三': '约翰三书',
    '犹': '犹大书',
    '启': '启示录',
};

// 构建正则表达式（支持简称和全称）
function buildBookPattern(): string {
    const allBooks = [
        ...Object.keys(BOOK_ABBREVIATIONS),
        ...Object.values(BOOK_ABBREVIATIONS),
    ];
    // 按长度降序排序，确保长的先匹配（如"撒母耳记上"先于"撒上"）
    allBooks.sort((a, b) => b.length - a.length);
    return allBooks.join('|');
}

const BOOK_PATTERN = buildBookPattern();

const OSIS_BOOKS = [
    'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal', 'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev',
] as const;

const CHINESE_BOOKS = [
    '创世记', '出埃及记', '利未记', '民数记', '申命记', '约书亚记', '士师记', '路得记', '撒母耳记上', '撒母耳记下', '列王纪上', '列王纪下', '历代志上', '历代志下', '以斯拉记', '尼希米记', '以斯帖记', '约伯记', '诗篇', '箴言', '传道书', '雅歌', '以赛亚书', '耶利米书', '耶利米哀歌', '以西结书', '但以理书', '何西阿书', '约珥书', '阿摩司书', '俄巴底亚书', '约拿书', '弥迦书', '那鸿书', '哈巴谷书', '西番雅书', '哈该书', '撒迦利亚书', '玛拉基书', '马太福音', '马可福音', '路加福音', '约翰福音', '使徒行传', '罗马书', '哥林多前书', '哥林多后书', '加拉太书', '以弗所书', '腓立比书', '歌罗西书', '帖撒罗尼迦前书', '帖撒罗尼迦后书', '提摩太前书', '提摩太后书', '提多书', '腓利门书', '希伯来书', '雅各书', '彼得前书', '彼得后书', '约翰一书', '约翰二书', '约翰三书', '犹大书', '启示录',
] as const;

const OSIS_TO_BOOK = new Map<string, string>(OSIS_BOOKS.map((osis, index) => [osis, CHINESE_BOOKS[index]]));
const externalParsers = [new bcv_parser(zhParser), new bcv_parser(enParser)];

/**
 * 解析文本中的所有经文引用。
 *
 * Primary path uses OpenBibleInfo's battle-tested parser. We keep the small
 * Chinese regex fallback because it covers a few app-specific shorthand forms
 * and protects the notebook if the external parser rejects a phrase.
 */
export function parseVerseReferences(text: string): VerseReference[] {
    const refs = [...parseWithOpenBibleParser(text), ...parseWithLocalFallback(text)];
    const seen = new Set<string>();

    return refs.filter((ref) => {
        const key = `${ref.book}-${ref.chapter}-${ref.startVerse}-${ref.endVerse ?? ref.startVerse}-${ref.position}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function parseWithOpenBibleParser(text: string): VerseReference[] {
    const refs: VerseReference[] = [];

    externalParsers.forEach((parser) => {
        parser.parse(text).osis_and_indices().forEach((match: { osis: string; indices: [number, number] }) => {
            const { osis, indices } = match;
            const parsed = parseOsisReference(osis);
            if (!parsed) return;

            const original = text.slice(indices[0], indices[1]);
            if (/\n/.test(original)) return;

            refs.push({
                original,
                position: indices[0],
                ...parsed,
            });
        });
    });

    return refs;
}

function parseOsisReference(osis: string): Omit<VerseReference, 'original' | 'position'> | null {
    const [start, end] = osis.split('-');
    const startParts = start.split('.');
    if (startParts.length < 3) return null;

    const [osisBook, chapterStr, verseStr] = startParts;
    const book = OSIS_TO_BOOK.get(osisBook);
    if (!book) return null;

    const endParts = end?.split('.') ?? [];
    const endVerse = endParts.length === 3 ? Number(endParts[2]) : undefined;

    return {
        book,
        chapter: Number(chapterStr),
        startVerse: Number(verseStr),
        endVerse,
    };
}

function parseWithLocalFallback(text: string): VerseReference[] {
    const refs: VerseReference[] = [];
    const rangeSeparator = '[-–—~～到至]';
    const pattern = new RegExp(
        `(${BOOK_PATTERN})\\s*(\\d{1,3})\\s*[:：]\\s*(\\d{1,3})(?:\\s*${rangeSeparator}\\s*(\\d{1,3}))?`,
        'g'
    );

    let match;
    while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, bookPart, chapterStr, startVerseStr, endVerseStr] = match;
        refs.push({
            original: fullMatch,
            book: BOOK_ABBREVIATIONS[bookPart] || bookPart,
            chapter: Number(chapterStr),
            startVerse: Number(startVerseStr),
            endVerse: endVerseStr ? Number(endVerseStr) : undefined,
            position: match.index,
        });
    }

    return refs;
}

/**
 * 根据书卷简称或全称获取标准书卷名
 */
export function getStandardBookName(bookInput: string): string | null {
    const normalizedInput = normalizeTraditionalBookName(bookInput.trim());

    // 先检查是否是简称
    if (BOOK_ABBREVIATIONS[normalizedInput]) {
        return BOOK_ABBREVIATIONS[normalizedInput];
    }

    // 检查是否是全称
    if (Object.values(BOOK_ABBREVIATIONS).includes(normalizedInput)) {
        return normalizedInput;
    }

    // 模糊匹配
    for (const [abbr, fullName] of Object.entries(BOOK_ABBREVIATIONS)) {
        if (fullName.includes(normalizedInput) || normalizedInput.includes(abbr)) {
            return fullName;
        }
    }

    return null;
}

function normalizeTraditionalBookName(value: string): string {
    const charMap: Record<string, string> = {
        '創': '创', '記': '记', '歷': '历', '書': '书', '詩': '诗',
        '傳': '传', '賽': '赛', '結': '结', '彌': '弥', '鴻': '鸿',
        '該': '该', '亞': '亚', '瑪': '玛', '馬': '马', '約': '约',
        '羅': '罗', '達': '达', '爾': '尔', '迦': '迦', '啟': '启',
        '國': '国', '數': '数', '衛': '卫', '錄': '录', '後': '后',
        '前': '前', '門': '门', '猶': '犹', '帖': '帖', '來': '来',
        '蘭': '兰', '倫': '伦', '優': '优', '萬': '万', '聲': '声',
    };

    return value.replace(/[\u3400-\u9fff]/g, (char) => charMap[char] || char);
}

