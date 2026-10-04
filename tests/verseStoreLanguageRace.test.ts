import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Verse } from '../types/verse';

const loader = vi.hoisted(() => ({
  pending: new Map<string, { resolve: (verses: Verse[]) => void; reject: (error: Error) => void }>(),
}));

vi.mock('../lib/dataLoader', () => ({
  loadPresetVerses: (language: string) =>
    new Promise<Verse[]>((resolve, reject) => loader.pending.set(language, { resolve, reject })),
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
  useVerseStore.setState({ verses: [], filteredVerses: [], versesLoaded: false, versesLoading: false, versesError: null });
});

describe('useVerseStore.loadVerses language race', () => {
  it('keeps the latest language when an earlier (default-script) load resolves last', async () => {
    // First render runs with the default Traditional script; the saved Simplified script follows right after.
    const first = useVerseStore.getState().loadVerses('preset', 'traditional');
    const second = useVerseStore.getState().loadVerses('preset', 'simplified');

    loader.pending.get('simplified')!.resolve([verse('创世记', '起初，神创造天地。')]);
    await second;
    loader.pending.get('traditional')!.resolve([verse('創世記', '起初，神創造天地。')]);
    await first;

    expect(useVerseStore.getState().verses[0].book).toBe('创世记');
    expect(useVerseStore.getState().verses[0].text).toBe('起初，神创造天地。');
  });

  it('keeps loading and resolves false when a stale request finishes while the latest is pending', async () => {
    const stale = useVerseStore.getState().loadVerses('preset', 'traditional');
    const latest = useVerseStore.getState().loadVerses('preset', 'simplified');

    loader.pending.get('traditional')!.resolve([verse('創世記', '起初，神創造天地。')]);
    await expect(stale).resolves.toBe(false);

    expect(useVerseStore.getState()).toMatchObject({ versesLoading: true, versesLoaded: false, verses: [] });

    loader.pending.get('simplified')!.resolve([verse('创世记', '起初，神创造天地。')]);
    await expect(latest).resolves.toBe(true);
    expect(useVerseStore.getState()).toMatchObject({ versesLoading: false, versesLoaded: true });
  });

  it('swallows a stale failure without touching the loading or error state', async () => {
    const stale = useVerseStore.getState().loadVerses('preset', 'traditional');
    const latest = useVerseStore.getState().loadVerses('preset', 'simplified');

    loader.pending.get('traditional')!.reject(new Error('stale boom'));
    await expect(stale).resolves.toBe(false);
    expect(useVerseStore.getState()).toMatchObject({ versesLoading: true, versesError: null });

    loader.pending.get('simplified')!.resolve([verse('创世记', '起初，神创造天地。')]);
    await expect(latest).resolves.toBe(true);
    expect(useVerseStore.getState().versesError).toBeNull();
  });

  it('ends in an error state (not loading, not loaded) when the latest request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const stale = useVerseStore.getState().loadVerses('preset', 'traditional');
    const latest = useVerseStore.getState().loadVerses('preset', 'simplified');

    loader.pending.get('simplified')!.reject(new Error('latest boom'));
    await expect(latest).rejects.toThrow('latest boom');
    expect(useVerseStore.getState()).toMatchObject({ versesLoading: false, versesLoaded: false, versesError: 'latest boom' });

    loader.pending.get('traditional')!.resolve([verse('創世記', '起初，神創造天地。')]);
    await expect(stale).resolves.toBe(false);
    expect(useVerseStore.getState()).toMatchObject({ verses: [], versesLoaded: false, versesError: 'latest boom' });
  });
});
