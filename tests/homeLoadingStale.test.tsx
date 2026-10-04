// @vitest-environment jsdom
import { act, cleanup, configure, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import HomePageClient from '../components/home/HomePageClient';
import { useAppStore } from '../stores/useAppStore';
import { useVerseStore } from '../stores/useVerseStore';

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
const booksJson = json({ books: [{ key: '创世记', nameSimplified: '创世记', nameTraditional: '創世記', nameEnglish: 'Genesis', chapters: 50, testament: 'old' }] });
const bible = (book: string, text: string) => json({ [book]: { 1: { 1: text } } });

function resolveAll(url: string, response: unknown) {
  (pending.get(url) ?? []).forEach((d) => d.resolve(response));
}

beforeEach(() => {
  pending.clear();
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() { return values.size; },
  });
  useAppStore.persist.setOptions({
    storage: createJSONStorage(() => ({ getItem: () => null, setItem: () => undefined, removeItem: () => undefined })),
  });
  useAppStore.setState({ language: 'traditional', theme: 'light' });
  useVerseStore.setState({ verses: [], books: [], versesLoaded: false, booksLoaded: false, versesLoading: false, booksLoading: false, versesError: null, booksError: null });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  vi.stubGlobal('matchMedia', () => ({
    matches: false, media: '', onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true,
  }));
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.startsWith('/data/')) return deferFetch(url);
    if (url === '/api/stats') return Promise.resolve(json({ totalUsers: 1, totalFavorites: 2 }));
    return Promise.resolve(json({}));
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Mimics the real page: first render uses the default script, then the persisted 简体 is applied. */
async function renderThenApplySavedSimplified() {
  const view = render(<HomePageClient />);
  await waitFor(() => expect(pending.get('/data/CUVT_bible.json')).toHaveLength(1));
  act(() => useAppStore.setState({ language: 'simplified' }));
  await waitFor(() => expect(pending.get('/data/CUV_bible.json')).toHaveLength(1));
  return view;
}

describe('home initial load with a superseded (default-script) request', () => {
  it('keeps loading (no empty state) when the stale request finishes first, then shows the verses', async () => {
    const view = await renderThenApplySavedSimplified();

    await act(async () => {
      resolveAll('/data/books.json', booksJson);
      resolveAll('/data/CUVT_bible.json', bible('创世记', '起初，神創造天地。'));
    });

    expect(view.container.textContent).toContain('加载中');
    expect(view.container.textContent).not.toContain('暂无经文');

    await act(async () => {
      resolveAll('/data/CUV_bible.json', bible('创世记', '起初，神创造天地。'));
    });

    await waitFor(() => expect(view.container.textContent).toContain('创世记'));
    expect(view.container.textContent).not.toContain('暂无经文');
    expect(view.container.textContent).not.toContain('創世記');
  });

  it('keeps loading when the stale request finishes last', async () => {
    const view = await renderThenApplySavedSimplified();

    await act(async () => {
      resolveAll('/data/books.json', booksJson);
    });
    expect(view.container.textContent).toContain('加载中');

    await act(async () => {
      resolveAll('/data/CUV_bible.json', bible('创世记', '起初，神创造天地。'));
    });
    await waitFor(() => expect(view.container.textContent).toContain('创世记'));

    await act(async () => {
      resolveAll('/data/CUVT_bible.json', bible('創世記', '起初，神創造天地。'));
    });
    expect(view.container.textContent).toContain('创世记');
    expect(view.container.textContent).not.toContain('創世記');
  });

  it('ignores a stale failure but shows an error when the latest request fails', async () => {
    const view = await renderThenApplySavedSimplified();

    await act(async () => {
      resolveAll('/data/books.json', booksJson);
      pending.get('/data/CUVT_bible.json')!.forEach((d) => d.reject(new Error('stale network error')));
    });
    expect(view.container.textContent).toContain('加载中');
    expect(view.container.textContent).not.toContain('stale network error');

    await act(async () => {
      resolveAll('/data/CUV_bible.json', { ok: false, statusText: 'Server Error', json: async () => ({}) });
    });
    await waitFor(() => expect(view.container.textContent).toContain('加载圣经数据失败'));
    expect(view.container.textContent).not.toContain('暂无经文');
  });
});
