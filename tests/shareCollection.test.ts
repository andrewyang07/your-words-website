import { describe, expect, it, vi } from 'vitest';
import { shareSavedVerseCollection } from '../lib/shareCollection';
import { decodeVerseList } from '../lib/bibleBookMapping';

describe('shareSavedVerseCollection', () => {
  it('copies a URL-only snapshot in canonical Bible order', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareSavedVerseCollection({
      verseIds: ['罗马书-8-28', '创世记-2-3', '创世记-1-2'],
      origin: 'https://example.com',
      clipboard: { writeText },
    });

    const expectedUrl = 'https://example.com/?s=1-1-2,1-2-3,45-8-28';
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(expectedUrl);
    expect(result).toEqual({ status: 'copied', url: expectedUrl, count: 3 });
  });

  it('deduplicates saved verse IDs before copying the snapshot', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareSavedVerseCollection({
      verseIds: ['诗篇-23-1', '诗篇-23-1', '约翰福音-3-16'],
      origin: 'https://example.com',
      clipboard: { writeText },
    });

    expect(writeText).toHaveBeenCalledWith('https://example.com/?s=19-23-1,43-3-16');
    expect(result).toEqual({
      status: 'copied',
      url: 'https://example.com/?s=19-23-1,43-3-16',
      count: 2,
    });
  });

  it('copies 200 unique verses but refuses a larger collection without copying part of it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const twoHundredIds = Array.from({ length: 200 }, (_, index) => `创世记-1-${index + 1}`);

    const boundaryResult = await shareSavedVerseCollection({
      verseIds: twoHundredIds,
      origin: 'https://example.com',
      clipboard: { writeText },
    });
    expect(boundaryResult.status).toBe('copied');
    expect(boundaryResult.count).toBe(200);
    expect(writeText).toHaveBeenCalledOnce();

    writeText.mockClear();
    const overLimitResult = await shareSavedVerseCollection({
      verseIds: [...twoHundredIds, '出埃及记-1-1'],
      origin: 'https://example.com',
      clipboard: { writeText },
    });
    expect(overLimitResult).toEqual({ status: 'too-many', count: 201, max: 200 });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('returns the full URL for manual copying when clipboard writing rejects or is unavailable', async () => {
    const expected = {
      status: 'manual-copy',
      url: 'https://example.com/?s=43-3-16',
      count: 1,
    };

    await expect(shareSavedVerseCollection({
      verseIds: ['约翰福音-3-16'],
      origin: 'https://example.com',
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })).resolves.toEqual(expected);

    await expect(shareSavedVerseCollection({
      verseIds: ['约翰福音-3-16'],
      origin: 'https://example.com',
    })).resolves.toEqual(expected);
  });

  it('produces a snapshot the existing receiver decoder reads as the same shared set', async () => {
    const result = await shareSavedVerseCollection({
      verseIds: ['罗马书-8-28', '约翰福音-3-16'],
      origin: 'https://example.com',
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    expect(result.status).toBe('copied');
    if (result.status !== 'copied') throw new Error('Expected clipboard copy to succeed');
    const encoded = new URL(result.url).searchParams.get('s');
    expect(decodeVerseList(encoded ?? '')).toEqual([
      { bookKey: '约翰福音', chapter: 3, verse: 16 },
      { bookKey: '罗马书', chapter: 8, verse: 28 },
    ]);
  });
});
