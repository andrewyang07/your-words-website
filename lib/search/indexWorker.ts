/**
 * Web Worker for off-main-thread index building
 *
 * Messages:
 * - { type: 'build', chinese: BibleJSON, english: BibleJSON, mappings: BookMapping[] }
 * - Response: { type: 'ready', indexData: SerializedIndex }
 * - { type: 'search', query: string }
 * - Response: { type: 'results', scores: [verseId, score][] }
 */

// Inline inverted index logic (workers can't import modules easily)
class WorkerIndex {
  private index = new Map<string, Set<string>>();

  addVerse(verseId: string, textChinese: string, textEnglish: string): void {
    // Chinese: chars + bigrams
    const chars = textChinese.match(/[\u4e00-\u9fff]/g);
    if (chars) {
      for (const char of chars) this.add(char, verseId);
      for (let i = 0; i < chars.length - 1; i++) {
        this.add(chars[i] + chars[i + 1], verseId);
      }
    }

    // English: words + 3-char prefixes
    const words = textEnglish.toLowerCase().match(/[a-z']+/g);
    if (words) {
      for (const word of words) {
        this.add(word, verseId);
        if (word.length > 3) this.add(word.substring(0, 3), verseId);
      }
    }
  }

  search(query: string): Map<string, number> {
    const scores = new Map<string, number>();
    const isChinese = /[\u4e00-\u9fff]/.test(query);

    if (isChinese) {
      const chars = query.match(/[\u4e00-\u9fff]/g);
      if (chars) {
        for (let i = 0; i < chars.length - 1; i++) {
          const matches = this.index.get(chars[i] + chars[i + 1]);
          if (matches) for (const id of matches) scores.set(id, (scores.get(id) || 0) + 3);
        }
        for (const char of chars) {
          const matches = this.index.get(char);
          if (matches) for (const id of matches) scores.set(id, (scores.get(id) || 0) + 1);
        }
      }
    } else {
      const words = query.toLowerCase().match(/[a-z']+/g);
      if (words) {
        for (const word of words) {
          const exact = this.index.get(word);
          if (exact) for (const id of exact) scores.set(id, (scores.get(id) || 0) + 3);
          if (word.length >= 3) {
            const prefix = this.index.get(word.substring(0, 3));
            if (prefix) for (const id of prefix) {
              if (!exact?.has(id)) scores.set(id, (scores.get(id) || 0) + 1);
            }
          }
        }
      }
    }

    return scores;
  }

  private add(token: string, verseId: string): void {
    let set = this.index.get(token);
    if (!set) { set = new Set(); this.index.set(token, set); }
    set.add(verseId);
  }
}

const workerIndex = new WorkerIndex();

type BibleJSON = Record<string, Record<string, Record<string, string>>>;
interface BookMapping { key: string; nameEnglish: string; }

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data;

  if (type === 'build') {
    const { chinese, english, mappings } = e.data as {
      chinese: BibleJSON;
      english: BibleJSON;
      mappings: BookMapping[];
    };

    // Build index from both Bible data sources
    const englishMap = new Map<string, string>();
    for (const m of mappings) englishMap.set(m.key, m.nameEnglish);

    for (const [bookChinese, chapters] of Object.entries(chinese)) {
      const bookEnglish = englishMap.get(bookChinese) || '';
      const englishBook = english[bookEnglish] || {};

      for (const [chapter, verses] of Object.entries(chapters)) {
        const englishChapter = englishBook[chapter] || {};
        for (const [verse, textChinese] of Object.entries(verses)) {
          const verseId = `${bookChinese}-${chapter}-${verse}`;
          const textEnglish = englishChapter[verse] || '';
          workerIndex.addVerse(verseId, textChinese, textEnglish);
        }
      }
    }

    self.postMessage({ type: 'ready' });
  }

  if (type === 'search') {
    const { query } = e.data as { query: string };
    const scores = workerIndex.search(query);
    // Convert Map to array for transfer
    const entries = Array.from(scores.entries());
    self.postMessage({ type: 'results', scores: entries });
  }
};
