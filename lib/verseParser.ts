// 经文引用解析工具

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

/**
 * 解析文本中的所有经文引用
 */
export function parseVerseReferences(text: string): VerseReference[] {
    const refs: VerseReference[] = [];
    const bookPattern = buildBookPattern();

    // 匹配格式：书卷名 + 章节 + : + 经文节数（可选范围）
    // 例如：约3:16, 约翰福音3:16, 创1:1-3
    const pattern = new RegExp(
        `(${bookPattern})\\s*(\\d{1,3})[:：](\\d{1,3})(?:[-\\-到至](\\d{1,3}))?`,
        'g'
    );

    let match;
    while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, bookPart, chapterStr, startVerseStr, endVerseStr] = match;

        // 解析书卷名（简称转全称）
        const book = BOOK_ABBREVIATIONS[bookPart] || bookPart;

        refs.push({
            original: fullMatch,
            book,
            chapter: parseInt(chapterStr, 10),
            startVerse: parseInt(startVerseStr, 10),
            endVerse: endVerseStr ? parseInt(endVerseStr, 10) : undefined,
            position: match.index,
        });
    }

    return refs;
}

/**
 * 检查文本中是否包含经文引用
 */
export function hasVerseReferences(text: string): boolean {
    return parseVerseReferences(text).length > 0;
}

/**
 * 根据书卷简称或全称获取标准书卷名
 */
export function getStandardBookName(bookInput: string): string | null {
    // 先检查是否是简称
    if (BOOK_ABBREVIATIONS[bookInput]) {
        return BOOK_ABBREVIATIONS[bookInput];
    }

    // 检查是否是全称
    if (Object.values(BOOK_ABBREVIATIONS).includes(bookInput)) {
        return bookInput;
    }

    // 模糊匹配
    for (const [abbr, fullName] of Object.entries(BOOK_ABBREVIATIONS)) {
        if (fullName.includes(bookInput) || bookInput.includes(abbr)) {
            return fullName;
        }
    }

    return null;
}

