import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCuvVersesById } from '../lib/memorize/loadVerses';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('deep memorization verse loading', () => {
  it('loads CUVT for traditional sessions while preserving the canonical verse id', async () => {
    const fetchBible = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: '神愛世人。' } },
      }),
    }));
    vi.stubGlobal('fetch', fetchBible);

    await expect(loadCuvVersesById(['约翰福音-3-16'], 'traditional')).resolves.toMatchObject([
      { id: '约翰福音-3-16', bookKey: '约翰福音', text: '神愛世人。' },
    ]);
    expect(fetchBible).toHaveBeenCalledWith('/data/CUVT_bible.json');
  });
});
