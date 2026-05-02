/**
 * Search engine orchestrator (singleton)
 * Uses MiniSearch for Chinese + English full-text search,
 * and pinyin-pro + fuzzy pinyin for phonetic Chinese search.
 */

import MiniSearch from 'minisearch';
import { parseReference } from './referenceParser';
import { buildPinyinIndex, buildPinyinIndexAsync, searchPinyin, type PinyinIndex } from './fuzzyPinyin';
import { fetchWithCache } from '@/lib/bibleDataCache';
import type {
  SearchResult,
  ContextVerse,
  BibleData,
  BookMapping,
} from '@/types/search';

type BibleJSON = Record<string, Record<string, Record<string, string>>>;

// Custom Chinese tokenizer: CJK single chars + 2-char bigrams
function tokenizeChinese(text: string): string[] {
  const chars = text.match(/[\u4e00-\u9fff]/g);
  if (!chars) return [];
  const tokens: string[] = [...chars];
  for (let i = 0; i < chars.length - 1; i++) {
    tokens.push(chars[i] + chars[i + 1]);
  }
  return tokens;
}

// Combined tokenizer for MiniSearch
function chineseTokenizer(text: string): string[] {
  // CJK tokens
  const cjk = tokenizeChinese(text);
  // English word tokens
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  return [...cjk, ...words];
}

interface DocRecord {
  id: string;
  textChinese: string;
  textEnglish: string;
}

class SearchEngine {
  private bibleData: BibleData | null = null;
  private bookMappings: BookMapping[] = [];
  private bookTraditionalMap = new Map<string, string>();
  private miniSearch: MiniSearch<DocRecord> | null = null;
  private pinyinIndex: PinyinIndex | null = null;
  private initPromise: Promise<void> | null = null;
  private _initialized = false;
  private _pinyinReady = false;

  get initialized(): boolean {
    return this._initialized;
  }

  get pinyinReady(): boolean {
    return this._pinyinReady;
  }

  async initialize(): Promise<void> {
    if (this._initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      const [chineseData, englishData, booksData] = await Promise.all([
        fetchWithCache('/data/CUV_bible.json') as Promise<BibleJSON>,
        fetchWithCache('/data/WEB_bible.json') as Promise<BibleJSON>,
        fetchWithCache('/data/books.json') as Promise<{
          books: Array<{ key: string; nameEnglish: string; nameTraditional: string }>;
        }>,
      ]);

      this.bibleData = { chinese: chineseData, english: englishData };
      this.bookMappings = booksData.books.map((b) => ({
        key: b.key,
        nameEnglish: b.nameEnglish,
      }));
      for (const b of booksData.books) {
        this.bookTraditionalMap.set(b.key, b.nameTraditional);
      }

      // Build MiniSearch index
      const englishMap = new Map<string, string>();
      for (const m of this.bookMappings) englishMap.set(m.key, m.nameEnglish);

      this.miniSearch = new MiniSearch<DocRecord>({
        fields: ['textChinese', 'textEnglish'],
        storeFields: [],
        tokenize: (text, fieldName) => {
          if (fieldName === 'textChinese') return chineseTokenizer(text);
          // English: default word tokenizer
          return text.toLowerCase().match(/[a-z']+/g) || [];
        },
        searchOptions: {
          tokenize: (query) => {
            // For search queries, use combined tokenizer
            return chineseTokenizer(query);
          },
        },
      });

      // Add all verses to MiniSearch
      const docs: DocRecord[] = [];
      for (const [bookChinese, chapters] of Object.entries(chineseData)) {
        const bookEnglish = englishMap.get(bookChinese) || '';
        const englishBook = englishData[bookEnglish] || {};
        for (const [chapter, verses] of Object.entries(chapters)) {
          const englishChapter = englishBook[chapter] || {};
          for (const [verse, textChinese] of Object.entries(verses)) {
            docs.push({
              id: `${bookChinese}-${chapter}-${verse}`,
              textChinese,
              textEnglish: englishChapter[verse] || '',
            });
          }
        }
      }
      await this.addDocsInChunks(docs);

      // Phase 1 complete: Chinese + English search ready
      this._initialized = true;

      // Phase 2: Build pinyin index asynchronously in idle time
      buildPinyinIndexAsync(chineseData, (index) => {
        this.pinyinIndex = index;
        this._pinyinReady = true;
      });
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  private async addDocsInChunks(docs: DocRecord[], chunkSize = 350): Promise<void> {
    if (!this.miniSearch) return;
    for (let i = 0; i < docs.length; i += chunkSize) {
      this.miniSearch.addAll(docs.slice(i, i + chunkSize));
      if (i + chunkSize < docs.length) {
        await new Promise<void>((resolve) => {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => resolve(), { timeout: 120 });
          } else {
            setTimeout(resolve, 0);
          }
        });
      }
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this._initialized || !this.bibleData) return [];
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Try reference parse first (O(1))
    const ref = parseReference(trimmed, this.bookMappings);
    if (ref && (ref.bookChinese || ref.bookEnglish)) {
      const refResults = this.searchByReference(ref);
      if (refResults.length > 0) return refResults;
    }

    // Keyword search
    return this.searchByKeyword(trimmed);
  }

  private searchByReference(ref: {
    bookChinese: string | null;
    bookEnglish: string | null;
    chapter?: number;
    verse?: number;
  }): SearchResult[] {
    if (!this.bibleData) return [];
    const { chinese, english } = this.bibleData;

    const bookChinese =
      ref.bookChinese ||
      this.bookMappings.find((m) => m.nameEnglish === ref.bookEnglish)?.key;
    const bookEnglish =
      ref.bookEnglish ||
      this.bookMappings.find((m) => m.key === ref.bookChinese)?.nameEnglish;

    if (!bookChinese) return [];

    const chineseBook = chinese[bookChinese];
    const englishBook = bookEnglish ? english[bookEnglish] : null;

    if (!chineseBook) return [];

    const results: SearchResult[] = [];
    const bookTrad = this.bookTraditionalMap.get(bookChinese) || bookChinese;

    if (ref.chapter && ref.verse) {
      const chapterData = chineseBook[String(ref.chapter)];
      if (chapterData && chapterData[String(ref.verse)]) {
        results.push({
          id: `${bookChinese}-${ref.chapter}-${ref.verse}`,
          bookKey: bookChinese,
          bookTraditional: bookTrad,
          bookEnglish: bookEnglish || '',
          chapter: ref.chapter,
          verse: ref.verse,
          textChinese: chapterData[String(ref.verse)],
          textEnglish:
            englishBook?.[String(ref.chapter)]?.[String(ref.verse)] || '',
          score: 100,
          matchType: 'reference',
        });
      }
    } else if (ref.chapter) {
      const chapterData = chineseBook[String(ref.chapter)];
      if (chapterData) {
        const verseNums = Object.keys(chapterData)
          .map(Number)
          .sort((a, b) => a - b)
          .slice(0, 5);
        for (const v of verseNums) {
          results.push({
            id: `${bookChinese}-${ref.chapter}-${v}`,
            bookKey: bookChinese,
            bookTraditional: bookTrad,
            bookEnglish: bookEnglish || '',
            chapter: ref.chapter,
            verse: v,
            textChinese: chapterData[String(v)],
            textEnglish:
              englishBook?.[String(ref.chapter)]?.[String(v)] || '',
            score: 90 - v,
            matchType: 'reference',
          });
        }
      }
    } else {
      const chapterNums = Object.keys(chineseBook)
        .map(Number)
        .sort((a, b) => a - b)
        .slice(0, 5);
      for (const ch of chapterNums) {
        const chapterData = chineseBook[String(ch)];
        const firstVerse = chapterData?.['1'];
        if (firstVerse) {
          results.push({
            id: `${bookChinese}-${ch}-1`,
            bookKey: bookChinese,
            bookTraditional: bookTrad,
            bookEnglish: bookEnglish || '',
            chapter: ch,
            verse: 1,
            textChinese: firstVerse,
            textEnglish: englishBook?.[String(ch)]?.['1'] || '',
            score: 80 - ch,
            matchType: 'reference',
          });
        }
      }
    }

    return results;
  }

  private searchByKeyword(query: string): SearchResult[] {
    if (!this.bibleData || !this.miniSearch) return [];

    const scores = new Map<string, number>();
    const hasCJK = /[\u4e00-\u9fff]/.test(query);
    const isLatinOnly = /^[a-zA-Z\s]+$/.test(query.trim());

    if (hasCJK) {
      // Chinese character search via MiniSearch
      const results = this.miniSearch.search(query, {
        fields: ['textChinese'],
        prefix: true,
      });
      for (const r of results) {
        scores.set(r.id, (scores.get(r.id) || 0) + r.score);
      }
    } else if (isLatinOnly) {
      // Try pinyin search
      if (this.pinyinIndex) {
        const pyScores = searchPinyin(query, this.pinyinIndex);
        for (const [id, score] of pyScores) {
          scores.set(id, (scores.get(id) || 0) + score);
        }
      }

      // Also do MiniSearch fuzzy search for English text
      const results = this.miniSearch.search(query, {
        fields: ['textEnglish'],
        fuzzy: 0.2,
        prefix: true,
      });
      for (const r of results) {
        // English matches get lower priority than pinyin for Latin-only queries
        scores.set(r.id, (scores.get(r.id) || 0) + r.score * 0.5);
      }
    } else {
      // Mixed or other: MiniSearch fuzzy on both fields
      const results = this.miniSearch.search(query, {
        fuzzy: 0.2,
        prefix: true,
      });
      for (const r of results) {
        scores.set(r.id, (scores.get(r.id) || 0) + r.score);
      }
    }

    // Sort by score descending, take top 50 for boosting
    const scoreEntries = Array.from(scores.entries());
    scoreEntries.sort((a, b) => b[1] - a[1]);
    const topEntries = scoreEntries.slice(0, 50);

    // Build result objects with score boosting
    const { chinese, english } = this.bibleData;
    const englishMap = new Map<string, string>();
    for (const m of this.bookMappings) englishMap.set(m.key, m.nameEnglish);

    const results: SearchResult[] = [];
    for (const [verseId, score] of topEntries) {
      const parts = verseId.split('-');
      const verse = parseInt(parts.pop()!, 10);
      const chapter = parseInt(parts.pop()!, 10);
      const bookKey = parts.join('-');

      const textChinese = chinese[bookKey]?.[String(chapter)]?.[String(verse)];
      if (!textChinese) continue;

      const bookEnglish = englishMap.get(bookKey) || '';
      const textEnglish =
        english[bookEnglish]?.[String(chapter)]?.[String(verse)] || '';

      // Boost score if query appears as exact substring
      let finalScore = score;
      const queryLower = query.toLowerCase();
      if (textChinese.includes(query)) finalScore += 10;
      if (textEnglish.toLowerCase().includes(queryLower)) finalScore += 10;
      const isChinese = /[\u4e00-\u9fff]/.test(query);
      if (isChinese && textChinese.includes(query)) finalScore += 5;
      if (!isChinese && textEnglish.toLowerCase().includes(queryLower))
        finalScore += 5;

      results.push({
        id: verseId,
        bookKey,
        bookTraditional: this.bookTraditionalMap.get(bookKey) || bookKey,
        bookEnglish,
        chapter,
        verse,
        textChinese,
        textEnglish,
        score: finalScore,
        matchType: 'keyword',
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  getContext(
    bookKey: string,
    chapter: number,
    verse: number
  ): ContextVerse[] {
    if (!this.bibleData) return [];
    const { chinese, english } = this.bibleData;

    const bookEnglish =
      this.bookMappings.find((m) => m.key === bookKey)?.nameEnglish || '';

    const chapterData = chinese[bookKey]?.[String(chapter)];
    const englishChapterData = english[bookEnglish]?.[String(chapter)];
    if (!chapterData) return [];

    const allVerses = Object.keys(chapterData)
      .map(Number)
      .sort((a, b) => a - b);

    const startVerse = Math.max(verse - 3, allVerses[0] || 1);
    const endVerse = Math.min(
      verse + 3,
      allVerses[allVerses.length - 1] || verse
    );

    const context: ContextVerse[] = [];
    for (let v = startVerse; v <= endVerse; v++) {
      const textChinese = chapterData[String(v)];
      if (!textChinese) continue;
      context.push({
        bookKey,
        bookEnglish,
        chapter,
        verse: v,
        textChinese,
        textEnglish: englishChapterData?.[String(v)] || '',
        isCurrent: v === verse,
      });
    }

    return context;
  }

  destroy(): void {
    this.miniSearch = null;
    this.pinyinIndex = null;
    this.bibleData = null;
    this._initialized = false;
    this.initPromise = null;
  }
}

// Singleton instance
let instance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (!instance) {
    instance = new SearchEngine();
  }
  return instance;
}
