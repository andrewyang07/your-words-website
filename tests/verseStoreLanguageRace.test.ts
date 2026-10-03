import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Verse } from '../types/verse';

const loader = vi.hoisted(() => ({
  pending: new Map<string, (verses: Verse[]) => void>(),
}));

vi.mock('../lib/dataLoader', () => ({
  loadPresetVerses: (language: string) =>
    new Promise<Verse[]>((resolve) => loader.pending.set(language, resolve)),
  loadChapterVerses: vi.fn(),
  loadBooks: vi.fn(),
}));

import { useVerseStore } from '../stores/useVerseStore';

const verse = (book: string, text: string): Verse => ({
  id: '创世记-1-1',
  book,
  bookKey: '创世记',
  chapter: 1,
  verse: 1,
  text,
  testament: 'old',
});

beforeEach(() => {
  loader.pending.clear();
  useVerseStore.setState({ verses: [], filteredVerses: [], versesLoaded: false });
});

describe('useVerseStore.loadVerses language race', () => {
  it('keeps the latest language when an earlier (default-script) load resolves last', async () => {
    // First render runs with the default Traditional script; the saved Simplified script follows right after.
    const first = useVerseStore.getState().loadVerses('preset', 'traditional');
    const second = useVerseStore.getState().loadVerses('preset', 'simplified');

    loader.pending.get('simplified')!([verse('创世记', '起初，神创造天地。')]);
    await second;
    loader.pending.get('traditional')!([verse('創世記', '起初，神創造天地。')]);
    await first;

    expect(useVerseStore.getState().verses[0].book).toBe('创世记');
    expect(useVerseStore.getState().verses[0].text).toBe('起初，神创造天地。');
  });
});
