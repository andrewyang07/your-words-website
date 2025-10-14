// 数据加载和处理工具

import { Verse, Book, Language } from '@/types/verse';
import { PRESET_VERSE_REFERENCES } from './constants';

// 从完整圣经 JSON 中提取指定的经文
export async function loadPresetVerses(language: Language): Promise<Verse[]> {
  const fileName =
    language === 'simplified'
      ? 'CUV_bible.json'
      : language === 'traditional'
      ? 'CUVT_bible.json'
      : 'WEB_bible.json';

  try {
    const response = await fetch(`/data/${fileName}`);
    const bibleData = await response.json();

    const verses: Verse[] = [];

    PRESET_VERSE_REFERENCES.forEach((ref, index) => {
      const bookData = bibleData[ref.book];
      if (!bookData) {
        console.warn(`书卷不存在: ${ref.book}`);
        return;
      }

      const chapterData = bookData[ref.chapter];
      if (!chapterData) {
        console.warn(`章节不存在: ${ref.book} ${ref.chapter}`);
        return;
      }

      const verseText = chapterData[ref.verse];
      if (!verseText) {
        console.warn(`经节不存在: ${ref.book} ${ref.chapter}:${ref.verse}`);
        return;
      }

      const testament = getTestament(ref.book);

      verses.push({
        id: `${ref.book}-${ref.chapter}-${ref.verse}`,
        book: ref.book,
        bookKey: ref.book,
        chapter: ref.chapter,
        verse: ref.verse,
        text: verseText,
        testament,
        priority: ref.priority,
      });
    });

    return verses;
  } catch (error) {
    console.error('加载预设经文失败:', error);
    return [];
  }
}

// 从完整圣经 JSON 中加载指定书卷的所有经文
export async function loadChapterVerses(
  bookKey: string,
  chapter: number,
  language: Language
): Promise<Verse[]> {
  const fileName =
    language === 'simplified'
      ? 'CUV_bible.json'
      : language === 'traditional'
      ? 'CUVT_bible.json'
      : 'WEB_bible.json';

  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`加载圣经数据失败: ${response.statusText}`);
    }
    
    const bibleData = await response.json();

    // 查找书卷数据
    const bookData = bibleData[bookKey];
    if (!bookData) {
      console.error(`书卷不存在: ${bookKey}`, '可用的书卷:', Object.keys(bibleData).slice(0, 10));
      throw new Error(`书卷不存在: ${bookKey}`);
    }

    const chapterData = bookData[chapter];
    if (!chapterData) {
      throw new Error(`章节不存在: ${bookKey} ${chapter}`);
    }

    const testament = getTestament(bookKey);
    const verses: Verse[] = [];

    Object.keys(chapterData).forEach((verseNum) => {
      const verseNumber = parseInt(verseNum);
      verses.push({
        id: `${bookKey}-${chapter}-${verseNumber}`,
        book: bookKey,
        bookKey: bookKey,
        chapter,
        verse: verseNumber,
        text: chapterData[verseNum],
        testament,
      });
    });

    // 按经文编号排序
    verses.sort((a, b) => a.verse - b.verse);

    return verses;
  } catch (error) {
    console.error('加载章节经文失败:', error);
    throw error;
  }
}

// 加载书卷信息
export async function loadBooks(language: Language = 'traditional'): Promise<Book[]> {
  try {
    const response = await fetch('/data/books.json');
    const data = await response.json();
    
    // 根据语言设置 name 属性
    return data.books.map((book: any) => ({
      ...book,
      id: book.key,
      name: language === 'simplified' ? book.nameSimplified : book.nameTraditional,
    }));
  } catch (error) {
    console.error('加载书卷信息失败:', error);
    return [];
  }
}

// 根据书卷名判断新约/旧约
function getTestament(bookName: string): 'old' | 'new' {
  const newTestamentBooks = [
    '马太福音',
    '马可福音',
    '路加福音',
    '约翰福音',
    '使徒行传',
    '罗马书',
    '哥林多前书',
    '哥林多后书',
    '加拉太书',
    '以弗所书',
    '腓立比书',
    '歌罗西书',
    '帖撒罗尼迦前书',
    '帖撒罗尼迦后书',
    '提摩太前书',
    '提摩太后书',
    '提多书',
    '腓利门书',
    '希伯来书',
    '雅各书',
    '彼得前书',
    '彼得后书',
    '约翰一书',
    '约翰二书',
    '约翰三书',
    '犹大书',
    '启示录',
  ];

  return newTestamentBooks.includes(bookName) ? 'new' : 'old';
}

// 获取书卷的所有章节数
export async function getBookChapters(book: string): Promise<number> {
  const books = await loadBooks();
  const bookInfo = books.find((b) => b.key === book);
  return bookInfo?.chapters || 0;
}

