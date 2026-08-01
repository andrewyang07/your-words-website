import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_READER_TEXT_SIZE,
  READER_TEXT_SIZES,
  getNextReaderTextSize,
} from '../lib/readerPreferences';

describe('verse reading text size preference', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    });
    vi.resetModules();
  });

  it('offers the confirmed five sizes and defaults to 100%', () => {
    expect(READER_TEXT_SIZES).toEqual([90, 100, 115, 130, 145]);
    expect(DEFAULT_READER_TEXT_SIZE).toBe(100);
  });

  it('steps through sizes without moving beyond either end', () => {
    expect(getNextReaderTextSize(100, 1)).toBe(115);
    expect(getNextReaderTextSize(100, -1)).toBe(90);
    expect(getNextReaderTextSize(90, -1)).toBe(90);
    expect(getNextReaderTextSize(145, 1)).toBe(145);
  });

  it('survives a store reload and resets only the verse text size', async () => {
    localStorage.setItem('unrelated-preference', 'keep-me');
    const firstLoad = await import('../stores/useReaderPreferencesStore');
    firstLoad.useReaderPreferencesStore.getState().setTextSize(130);

    vi.resetModules();
    const reloaded = await import('../stores/useReaderPreferencesStore');
    expect(reloaded.useReaderPreferencesStore.getState().textSize).toBe(130);

    reloaded.useReaderPreferencesStore.getState().resetTextSize();
    expect(reloaded.useReaderPreferencesStore.getState().textSize).toBe(100);
    expect(localStorage.getItem('unrelated-preference')).toBe('keep-me');
  });
});
