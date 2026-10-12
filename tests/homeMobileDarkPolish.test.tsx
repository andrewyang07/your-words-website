// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import HomePageClient from '../components/home/HomePageClient';
import { useFavoritesStore } from '../stores/useFavoritesStore';
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
const _presets = (text: string) => json({ simplified: { '创世记-1-1': text }, traditional: { '创世记-1-1': text } });

function resolveAll(url: string, response: unknown) {
  (pending.get(url) ?? []).forEach((d) => d.resolve(response));
}

let stats: { promise: Promise<unknown>; resolve: (v: unknown) => void };
beforeEach(() => {
  let r!: (v: unknown) => void;
  stats = { promise: new Promise((res) => (r = res)), resolve: r };
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
  useAppStore.setState({ language: 'simplified', theme: 'light' });
  useFavoritesStore.setState({ favorites: new Set<string>() });
  document.documentElement.classList.remove('dark');
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
      if (url === '/api/stats') return stats.promise;
      return Promise.resolve(json({}));
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const many: Record<string, string> = {};
for (let v = 1; v <= 3; v += 1) many[`创世记-1-${v}`] = `第${v}节经文`;
const versesJson = json({ simplified: many, traditional: many });

async function renderHome(waitCards = true) {
  render(<HomePageClient />);
  await waitFor(() => expect(pending.get('/data/books.json')).toBeDefined());
  resolveAll('/data/books.json', booksJson);
  await waitFor(() => expect(pending.get('/data/presets.json')).toBeDefined());
  resolveAll('/data/presets.json', versesJson);
  if (waitCards) await screen.findAllByLabelText(/1章1节/);
}

describe('home mobile/dark polish (QA group 5)', () => {
  it('footer © uses the current year', async () => {
    await renderHome();
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} 你的话语`))).toBeTruthy();
    expect(screen.queryByText(/© 2025/)).toBeNull();
  });

  it('footer stats share the header data and never show a fake 0 while loading', async () => {
    await renderHome();
    const footer = document.querySelector('footer')!;
    expect(footer.textContent).not.toMatch(/\b0\s*位访客/);
    expect(footer.textContent).toContain('…');
    stats.resolve(json({ totalUsers: 844, totalFavorites: 66 }));
    await waitFor(() => expect(footer.textContent).toContain('844'));
    expect(footer.textContent).toContain('66');
    expect(document.body.textContent).toContain('844 访客');
  });

  it('auto favorites view is labelled and clearable', async () => {
    useFavoritesStore.setState({ favorites: new Set(['创世记-1-1']) });
    await renderHome(false);
    const clear = await screen.findByTestId('favorites-filter-clear');
    expect(screen.getByText('只看收藏')).toBeTruthy();
    fireEvent.click(clear);
    await waitFor(() => expect(screen.queryByTestId('favorites-filter-clear')).toBeNull());
    expect(screen.getByText('我的收藏')).toBeTruthy();
  });

  it('mobile header icons carry visible labels and a visible theme toggle exists', async () => {
    await renderHome();
    for (const label of ['统计', '设置', '菜单', '阅读', '深色'])
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('load more is an idle, clickable button, not a perpetual spinner', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'components/home/HomePageClient.tsx'), 'utf8');
    const start = src.indexOf('data-testid="load-more"');
    const block = src.slice(start - 200, src.indexOf('</button>', start));
    expect(block).toContain('<button');
    expect(block).toContain('setVisibleCount');
    expect(block).not.toContain('animate-spin');
  });

  it('shuffle sits before the book picker so it never wraps alone', async () => {
    await renderHome();
    const shuffle = screen.getByTitle('重新排列');
    const picker = screen.getByRole('button', { name: /选择书卷/ });
    expect(shuffle.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('share toast is anchored at the bottom (never over the search box)', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'components/home/HomePageClient.tsx'), 'utf8');
    const toast = src.slice(src.indexOf('data-testid="share-toast"') - 300, src.indexOf('data-testid="share-toast"'));
    expect(toast).toContain('bottom-5');
    expect(toast).not.toMatch(/top-24/);
  });
});
