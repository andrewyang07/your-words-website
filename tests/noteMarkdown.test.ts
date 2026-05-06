import { describe, expect, it } from 'vitest';
import { buildInsertedVerseMarkdown, getInsertionToast, uniqueVerseReferences } from '../lib/noteMarkdown';
import type { VerseReference } from '../lib/verseParser';

const ref = (overrides: Partial<VerseReference>): VerseReference => ({
  original: '约3:16',
  book: '约翰福音',
  chapter: 3,
  startVerse: 16,
  position: 0,
  ...overrides,
});

describe('noteMarkdown helpers', () => {
  it('formats inserted chapter verses as stable blockquotes', () => {
    const markdown = buildInsertedVerseMarkdown([
      { book: '约翰福音', chapter: 3, verse: 16, text: '神愛世人。' },
      { book: '约翰福音', chapter: 3, verse: 17, text: '神差他的兒子。' },
    ]);

    expect(markdown).toBe('\n> 约翰福音3:16: 神愛世人。\n\n> 约翰福音3:17: 神差他的兒子。\n');
  });

  it('uses honest insertion toast copy for cursor and append fallbacks', () => {
    expect(getInsertionToast('chapter', 2, true)).toBe('已插入 2 節經文');
    expect(getInsertionToast('chapter', 2, false)).toBe('已添加 2 節到筆記末尾');
    expect(getInsertionToast('ocr', 1, true)).toBe('已插入 1 条 OCR 引用');
    expect(getInsertionToast('ocr', 1, false)).toBe('已添加 1 条 OCR 引用到笔记末尾');
  });

  it('dedupes references by scripture identity instead of original text', () => {
    const refs = uniqueVerseReferences([
      ref({ original: '约3:16', position: 2 }),
      ref({ original: '约翰福音3:16', position: 20 }),
      ref({ original: 'John 3:17', startVerse: 17, position: 42 }),
    ]);

    expect(refs.map((item) => item.original)).toEqual(['约3:16', 'John 3:17']);
  });
});
