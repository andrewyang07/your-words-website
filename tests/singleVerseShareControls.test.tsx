import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import VerseCard from '../components/verses/VerseCard';
import SearchResultCard from '../components/search/SearchResultCard';
import DiscoveryVerseCard from '../components/discover/DiscoveryVerseCard';
import type { Verse } from '../types/verse';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const verse: Verse = {
  id: '约翰福音-3-16',
  book: '约翰福音',
  bookKey: '约翰福音',
  chapter: 3,
  verse: 16,
  text: '神爱世人。',
  testament: 'new',
};

describe('single-verse card actions', () => {
  it('does not expose sharing on normal, search-result, or discovery cards', () => {
    const surfaces = [
      renderToStaticMarkup(<VerseCard verse={verse} />),
      renderToStaticMarkup(<SearchResultCard
        result={{
          id: verse.id,
          bookKey: verse.bookKey,
          bookTraditional: '約翰福音',
          bookEnglish: 'John',
          chapter: verse.chapter,
          verse: verse.verse,
          textChinese: verse.text,
          textEnglish: 'For God so loved the world.',
          score: 100,
          matchType: 'reference',
        }}
        index={0}
        isSelected={false}
      />),
      renderToStaticMarkup(<DiscoveryVerseCard verse={verse} saved={false} onSave={vi.fn()} />),
    ];

    for (const markup of surfaces) {
      expect(markup).not.toContain('分享');
    }
  });
});
