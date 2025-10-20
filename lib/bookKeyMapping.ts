// 书卷 Key 映射表 - 中文 Key 到英文 Key 的转换
// 用于在加载 WEB_bible.json (英文版) 时将中文 key 转换为英文 key

export const chineseToEnglishKeyMap: Record<string, string> = {
    // 旧约 - Old Testament
    '创世记': 'Genesis',
    '出埃及记': 'Exodus',
    '利未记': 'Leviticus',
    '民数记': 'Numbers',
    '申命记': 'Deuteronomy',
    '约书亚记': 'Joshua',
    '士师记': 'Judges',
    '路得记': 'Ruth',
    '撒母耳记上': '1 Samuel',
    '撒母耳记下': '2 Samuel',
    '列王纪上': '1 Kings',
    '列王纪下': '2 Kings',
    '历代志上': '1 Chronicles',
    '历代志下': '2 Chronicles',
    '以斯拉记': 'Ezra',
    '尼希米记': 'Nehemiah',
    '以斯帖记': 'Esther',
    '约伯记': 'Job',
    '诗篇': 'Psalms',
    '箴言': 'Proverbs',
    '传道书': 'Ecclesiastes',
    '雅歌': 'Song of Solomon',
    '以赛亚书': 'Isaiah',
    '耶利米书': 'Jeremiah',
    '耶利米哀歌': 'Lamentations',
    '以西结书': 'Ezekiel',
    '但以理书': 'Daniel',
    '何西阿书': 'Hosea',
    '约珥书': 'Joel',
    '阿摩司书': 'Amos',
    '俄巴底亚书': 'Obadiah',
    '约拿书': 'Jonah',
    '弥迦书': 'Micah',
    '那鸿书': 'Nahum',
    '哈巴谷书': 'Habakkuk',
    '西番雅书': 'Zephaniah',
    '哈该书': 'Haggai',
    '撒迦利亚书': 'Zechariah',
    '玛拉基书': 'Malachi',
    
    // 新约 - New Testament
    '马太福音': 'Matthew',
    '马可福音': 'Mark',
    '路加福音': 'Luke',
    '约翰福音': 'John',
    '使徒行传': 'Acts',
    '罗马书': 'Romans',
    '哥林多前书': '1 Corinthians',
    '哥林多后书': '2 Corinthians',
    '加拉太书': 'Galatians',
    '以弗所书': 'Ephesians',
    '腓立比书': 'Philippians',
    '歌罗西书': 'Colossians',
    '帖撒罗尼迦前书': '1 Thessalonians',
    '帖撒罗尼迦后书': '2 Thessalonians',
    '提摩太前书': '1 Timothy',
    '提摩太后书': '2 Timothy',
    '提多书': 'Titus',
    '腓利门书': 'Philemon',
    '希伯来书': 'Hebrews',
    '雅各书': 'James',
    '彼得前书': '1 Peter',
    '彼得后书': '2 Peter',
    '约翰一书': '1 John',
    '约翰二书': '2 John',
    '约翰三书': '3 John',
    '犹大书': 'Jude',
    '启示录': 'Revelation',
};

// 反向映射：英文 Key 到中文 Key
export const englishToChineseKeyMap: Record<string, string> = Object.fromEntries(
    Object.entries(chineseToEnglishKeyMap).map(([chinese, english]) => [english, chinese])
);

// 根据语言获取正确的书卷 key
export function getBookKey(chineseKey: string, language: 'simplified' | 'traditional' | 'english'): string {
    if (language === 'english') {
        return chineseToEnglishKeyMap[chineseKey] || chineseKey;
    }
    return chineseKey;
}

// 从任意语言的 key 获取中文 key（用于内部统一标识）
export function normalizeBookKey(key: string): string {
    // 如果是英文 key，转换为中文
    if (englishToChineseKeyMap[key]) {
        return englishToChineseKeyMap[key];
    }
    // 否则已经是中文 key
    return key;
}

