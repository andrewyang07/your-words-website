// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import RevealHint, { HOME_HINT_BOOT_SCRIPT, HOME_HINT_DISMISSED_KEY } from '../components/home/RevealHint';
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
const _presets = (text: string) => json({ simplified: { '创世记-1-1': text }, traditional: { '创世记-1-1': text } });

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

const verseJson = json({
  simplified: { '创世记-1-1': '起初神创造天地。' },
  traditional: { '创世记-1-1': '起初神創造天地。' },
});

async function renderHome(language: 'simplified' | 'traditional' = 'simplified') {
  useAppStore.setState({ language });
  const view = render(<HomePageClient />);
  await waitFor(() => expect(pending.get('/data/books.json')).toBeDefined());
  resolveAll('/data/books.json', booksJson);
  resolveAll('/data/presets.json', verseJson);
  await screen.findAllByLabelText(/创世记|創世記|1章1节/);
  return view;
}
const cards = () => screen.getAllByLabelText(/1章1节/);
const hint = () => screen.queryByTestId('home-reveal-hint');
const toggle = () =>
  screen.getByRole('button', { name: /^(切换到背诵模式|切换到阅读模式|切換到背誦模式|切換到閱讀模式)$/ });

describe('home default reveal + hint (spec home-default-reveal-hint-v1)', () => {
  it('fresh visit: cards show full text and the hint is visible (简体)', async () => {
    await renderHome();
    expect(cards()[0]!.getAttribute('aria-label')).toContain('已展开');
    expect(hint()?.textContent).toContain('点右上角「背诵」切换全部');
  });

  it('繁體 copy', async () => {
    await renderHome('traditional');
    expect(hint()?.textContent).toContain('點右上角「背誦」切換全部');
  });

  it('a card toggles on its own; the top-right button toggles all and the hint names it', async () => {
    await renderHome();
    fireEvent.click(cards()[0]!);
    expect(cards()[0]!.getAttribute('aria-label')).toContain('已收起');
    fireEvent.click(toggle()); // 背诵: hide all
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    expect(cards()[0]!.getAttribute('aria-label')).toContain('已收起');
    expect(hint()?.textContent).toContain('「阅读」');
    fireEvent.click(toggle());
    expect(cards()[0]!.getAttribute('aria-label')).toContain('已展开');
  });

  it('mode is not persisted: after 背诵, a reload shows full text again', async () => {
    const first = await renderHome();
    fireEvent.click(toggle());
    expect(cards()[0]!.getAttribute('aria-label')).toContain('已收起');
    first.unmount();
    pending.clear();
    await renderHome();
    expect(cards()[0]!.getAttribute('aria-label')).toContain('已展开');
  });

  it('the old gray hint line is gone from the status bar; the 精选 title stays', async () => {
    await renderHome();
    expect(screen.queryByText(/空心圆是背诵遮字|阅读模式：完整显示经文/)).toBeNull();
    expect(screen.getByText(/精选 114/)).toBeTruthy();
  });
});

describe('RevealHint dismissal', () => {
  afterEach(() => document.documentElement.classList.remove('home-hint-dismissed'));

  it('× hides it and stores home-hint-dismissed:v1=1', () => {
    render(<RevealHint language="simplified" showAllContent />);
    fireEvent.click(screen.getByRole('button', { name: '关闭提示' }));
    expect(hint()).toBeNull();
    expect(localStorage.getItem(HOME_HINT_DISMISSED_KEY)).toBe('1');
    expect(document.documentElement.classList.contains('home-hint-dismissed')).toBe(true);
  });

  it('boot script hides it before paint on later visits; removing the key shows it again', () => {
    localStorage.setItem(HOME_HINT_DISMISSED_KEY, '1');
    new Function(HOME_HINT_BOOT_SCRIPT)();
    expect(document.documentElement.classList.contains('home-hint-dismissed')).toBe(true);
    const css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toMatch(/html\.home-hint-dismissed \.home-reveal-hint\s*\{\s*display: none;/);

    document.documentElement.classList.remove('home-hint-dismissed');
    localStorage.removeItem(HOME_HINT_DISMISSED_KEY);
    new Function(HOME_HINT_BOOT_SCRIPT)();
    expect(document.documentElement.classList.contains('home-hint-dismissed')).toBe(false);
  });

  it('works without localStorage (session-only, no error)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(() => new Function(HOME_HINT_BOOT_SCRIPT)()).not.toThrow();
    render(<RevealHint language="simplified" showAllContent />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: '关闭提示' }))).not.toThrow();
    expect(hint()).toBeNull();
  });

  it('is server-rendered (no pop-in / CLS) as a single nowrap 28px line with a short mobile copy', () => {
    const html = renderToString(<RevealHint language="simplified" showAllContent />);
    expect(html).toContain('home-reveal-hint');
    expect(html).toMatch(/class="[^"]*\bh-7\b[^"]*whitespace-nowrap/);
    const mobile = '👆 点卡片遮字/显示 · 右上角「背诵」切换全部';
    expect(html).toContain(mobile);
    expect([...mobile].length).toBeLessThanOrEqual(24);
  });
});
