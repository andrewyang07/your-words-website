import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchResult } from '../types/search';

vi.mock('../lib/bibleDataCache', () => ({
  fetchWithCache: vi.fn(async (url: string) =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', url), 'utf8'))
  ),
}));

const pagefind = vi.hoisted(() => ({ results: [] as SearchResult[], calls: 0 }));
vi.mock('../lib/search/pagefindClient', () => ({
  searchWithPagefind: vi.fn(async () => {
    pagefind.calls += 1;
    return { results: pagefind.results, truncated: false };
  }),
}));

import { runClientSearch } from '../lib/search/runClientSearch';
import { parseVerseReference } from '../lib/search/referenceFirst';

const books = (
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/books.json'), 'utf8')) as {
    books: { key: string; nameEnglish: string }[];
  }
).books.map((b) => ({ key: b.key, nameEnglish: b.nameEnglish }));

function hit(bookKey: string, chapter: number, verse: number, score: number): SearchResult {
  return {
    id: `${bookKey}-${chapter}-${verse}`,
    bookKey,
    bookTraditional: bookKey,
    bookEnglish: '',
    chapter,
    verse,
    textChinese: 'x',
    textEnglish: '',
    score,
    matchType: 'keyword',
  };
}

// What Pagefind actually returned in production for "约翰福音 3:16" / "John 3:16".
const PROD_LIKE = [
  hit('约翰福音', 16, 3, 50),
  hit('约翰一书', 3, 16, 49),
  hit('约翰福音', 3, 16, 48),
  hit('约翰福音', 3, 17, 47),
];

const ids = (rs: SearchResult[]) => rs.map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);

beforeEach(() => {
  pagefind.results = PROD_LIKE;
  pagefind.calls = 0;
});

describe('parseVerseReference', () => {
  it.each([
    ['约翰福音 3:16', '约翰福音', 16, 16],
    ['約翰福音 3:16', '约翰福音', 16, 16],
    ['约3:16', '约翰福音', 16, 16],
    ['约翰福音3：16', '约翰福音', 16, 16],
    ['John 3:16', '约翰福音', 16, 16],
    ['jn 3:16', '约翰福音', 16, 16],
    ['1 John 3:16', '约翰一书', 16, 16],
    ['约翰福音 3:16-18', '约翰福音', 16, 18],
    ['John 3:16–18', '约翰福音', 16, 18],
  ])('%s', (q, bookKey, start, end) => {
    expect(parseVerseReference(q, books)).toEqual({
      bookKey,
      chapter: 3,
      verseStart: start,
      verseEnd: end,
    });
  });

  it.each(['神爱世人', '约翰福音', '约翰福音 3', 'love 3', ''])('ignores %s', (q) => {
    expect(parseVerseReference(q, books)).toBeNull();
  });
});

describe('runClientSearch reference-first', () => {
  it.each(['约翰福音 3:16', '約翰福音 3:16', '约3:16', 'John 3:16', 'Jn 3:16'])(
    '%s puts John 3:16 first, then full-text results',
    async (q) => {
      const { results } = await runClientSearch(q);
      expect(ids(results)).toEqual([
        '约翰福音 3:16',
        '约翰福音 16:3',
        '约翰一书 3:16',
        '约翰福音 3:17',
      ]);
      expect(results[0]?.matchType).toBe('reference');
    }
  );

  it('orders a range in verse order and fills verses Pagefind missed from the corpus', async () => {
    const { results } = await runClientSearch('约翰福音 3:16-18');
    expect(ids(results).slice(0, 4)).toEqual([
      '约翰福音 3:16',
      '约翰福音 3:17',
      '约翰福音 3:18',
      '约翰福音 16:3',
    ]);
    expect(results[2]?.textChinese).toContain('信');
  });

  it('fetches the verse when Pagefind did not return it at all', async () => {
    pagefind.results = [hit('约翰福音', 16, 3, 50)];
    const { results } = await runClientSearch('罗马书 8:28');
    expect(ids(results)).toEqual(['罗马书 8:28', '约翰福音 16:3']);
    expect(results[0]?.textChinese).toContain('万事都互相效力');
  });

  it('leaves non-reference queries untouched', async () => {
    const { results } = await runClientSearch('神爱世人');
    expect(results).toBe(pagefind.results);
  });

  it('respects the limit', async () => {
    const { results } = await runClientSearch('约翰福音 3:16', 2);
    expect(ids(results)).toEqual(['约翰福音 3:16', '约翰福音 16:3']);
  });
});
