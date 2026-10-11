// @vitest-environment jsdom
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import HomePageClient from '../components/home/HomePageClient';
import { useAppStore } from '../stores/useAppStore';
import { useVerseStore } from '../stores/useVerseStore';

const pagefind = vi.hoisted(() => ({
  calls: [] as { query: string; resolve: (r: unknown) => void }[],
}));
vi.mock('../lib/search/pagefindClient', () => ({
  searchWithPagefind: (query: string) =>
    new Promise((resolve) => {
      pagefind.calls.push({ query, resolve });
    }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

configure({ asyncUtilTimeout: 5000 });
vi.setConfig({ testTimeout: 30_000 });

type Deferred = { resolve: (res: unknown) => void; reject: (err: Error) => void; promise: Promise<unknown> };
const pending = new Map<string, Deferred[]>();

function deferFetch(url: string): Promise<unknown> {
  let resolve!: Deferred['resolve'];
  let reject!: Deferred['reject'];
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  pending.set(url, [...(pending.get(url) ?? []), { resolve, reject, promise }]);
  return promise;
}

const json = (data: unknown) => ({ ok: true, statusText: 'OK', json: async () => data });
const booksJson = json({
  books: [
    {
      key: '创世记',
      nameSimplified: '创世记',
      nameTraditional: '創世記',
      nameEnglish: 'Genesis',
      chapters: 50,
      testament: 'old',
    },
  ],
});
// Both scripts load the same small presets file; request 0 is the stale default-script (繁) load, 1 the saved 简体.
const presets = (text: string) => json({ simplified: { '创世记-1-1': text }, traditional: { '创世记-1-1': text } });

function resolveAll(url: string, response: unknown) {
  (pending.get(url) ?? []).forEach((d) => d.resolve(response));
}

beforeEach(() => {
  pending.clear();
  pagefind.calls.length = 0;
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  });
  useAppStore.persist.setOptions({
    storage: createJSONStorage(() => ({ getItem: () => null, setItem: () => undefined, removeItem: () => undefined })),
  });
  useAppStore.setState({ language: 'traditional', theme: 'light' });
  useVerseStore.setState({
    verses: [],
    books: [],
    versesLoaded: false,
    booksLoaded: false,
    versesLoading: false,
    booksLoading: false,
    versesError: null,
    booksError: null,
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => true,
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.startsWith('/data/')) return deferFetch(url);
      if (url === '/api/stats') return Promise.resolve(json({ totalUsers: 1, totalFavorites: 2 }));
      return Promise.resolve(json({}));
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const staleHit = {
  id: '创世记-1-1',
  bookKey: '创世记',
  bookTraditional: '創世記',
  bookEnglish: 'Genesis',
  chapter: 1,
  verse: 1,
  textChinese: 'STALE-RESULT',
  textEnglish: '',
  score: 1,
  matchType: 'keyword',
};

describe('home search clear (✕) with a slow in-flight search', () => {
  it('cancels the search: no lingering spinner, stale results never shown', async () => {
    useAppStore.setState({ language: 'simplified' });
    render(<HomePageClient />);
    await waitFor(() => expect(pending.get('/data/books.json')).toBeDefined());
    resolveAll('/data/books.json', booksJson);
    resolveAll('/data/presets.json', presets('起初'));

    const input = await screen.findByLabelText('搜索经文');
    fireEvent.change(input, { target: { value: '神爱' } });
    await waitFor(() => expect(pagefind.calls).toHaveLength(1));
    expect(screen.queryByText('正在翻找经文索引')).not.toBeNull();

    fireEvent.click(screen.getByLabelText('清除搜索'));
    expect(screen.queryByText('正在翻找经文索引')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('');

    await act(async () => pagefind.calls[0]!.resolve({ results: [staleHit], truncated: false }));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/STALE-RESULT/)).toBeNull();
    expect(screen.queryByText('正在翻找经文索引')).toBeNull();
  });

  it('a pending debounce is dropped by ✕ (search never starts)', async () => {
    useAppStore.setState({ language: 'simplified' });
    pagefind.calls.length = 0;
    render(<HomePageClient />);
    await waitFor(() => expect(pending.get('/data/books.json')).toBeDefined());
    resolveAll('/data/books.json', booksJson);
    resolveAll('/data/presets.json', presets('起初'));

    const input = await screen.findByLabelText('搜索经文');
    fireEvent.change(input, { target: { value: '神爱' } });
    fireEvent.click(screen.getByLabelText('清除搜索'));
    await new Promise((r) => setTimeout(r, 300));
    expect(pagefind.calls).toHaveLength(0);
  });

  it('Escape cancels the in-flight search like ✕', async () => {
    useAppStore.setState({ language: 'simplified' });
    render(<HomePageClient />);
    await waitFor(() => expect(pending.get('/data/books.json')).toBeDefined());
    resolveAll('/data/books.json', booksJson);
    resolveAll('/data/presets.json', presets('起初'));

    const input = await screen.findByLabelText('搜索经文');
    fireEvent.change(input, { target: { value: '神爱' } });
    await waitFor(() => expect(pagefind.calls).toHaveLength(1));
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('正在翻找经文索引')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('');

    await act(async () => pagefind.calls[0]!.resolve({ results: [staleHit], truncated: false }));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/STALE-RESULT/)).toBeNull();
  });
});
