// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBox from '../components/search/SearchBox';
import { getChromeCopy } from '../lib/uiScript';
import { useSearchStore } from '../stores/useSearchStore';
import type { SearchResult } from '../types/search';

const pending = vi.hoisted(() => new Map<string, (r: { results: unknown[]; truncated: boolean }) => void>());
vi.mock('../lib/search/runClientSearch', () => ({
  runClientSearch: (q: string) =>
    new Promise((resolve) => {
      pending.set(q, resolve);
    }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

const hit = (id: string): SearchResult => ({
  id,
  bookKey: '约翰福音',
  bookTraditional: '約翰福音',
  bookEnglish: 'John',
  chapter: 3,
  verse: 16,
  textChinese: id,
  textEnglish: '',
  score: 1,
  matchType: 'keyword',
});

beforeEach(() => {
  vi.useFakeTimers();
  pending.clear();
  useSearchStore.setState({ query: '', results: [], loading: false });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

describe('SearchBox', () => {
  it('enters loading immediately on input (no 未找到 flash during the debounce)', () => {
    const { container } = render(<SearchBox />);
    const input = container.querySelector('input')!;
    type(input, '神爱');
    expect(useSearchStore.getState().loading).toBe(true);
    expect(pending.size).toBe(0); // still debouncing
  });

  it('drops stale responses that resolve after a newer search', async () => {
    const { container } = render(<SearchBox />);
    const input = container.querySelector('input')!;
    type(input, '神爱');
    await act(async () => vi.advanceTimersByTime(200));
    type(input, '神爱世人');
    await act(async () => vi.advanceTimersByTime(200));

    await act(async () => pending.get('神爱世人')!({ results: [hit('new')], truncated: false }));
    await act(async () => pending.get('神爱')!({ results: [hit('old')], truncated: false }));

    expect(useSearchStore.getState().results.map((r) => r.id)).toEqual(['new']);
    expect(useSearchStore.getState().loading).toBe(false);
  });

  it('keeps loading while only a stale search has resolved', async () => {
    const { container } = render(<SearchBox />);
    const input = container.querySelector('input')!;
    type(input, '神爱');
    await act(async () => vi.advanceTimersByTime(200));
    type(input, '神爱世人');
    await act(async () => vi.advanceTimersByTime(200));
    await act(async () => pending.get('神爱')!({ results: [hit('old')], truncated: false }));
    expect(useSearchStore.getState().loading).toBe(true);
    expect(useSearchStore.getState().results).toEqual([]);
  });

  it('clearing the input cancels loading and ignores in-flight results', async () => {
    const { container } = render(<SearchBox />);
    const input = container.querySelector('input')!;
    type(input, '神爱');
    await act(async () => vi.advanceTimersByTime(200));
    type(input, '');
    expect(useSearchStore.getState().loading).toBe(false);
    await act(async () => pending.get('神爱')!({ results: [hit('old')], truncated: false }));
    expect(useSearchStore.getState().results).toEqual([]);
  });
});

describe('SearchBox clear while a slow search is in flight', () => {
  async function startSlowSearch() {
    const view = render(<SearchBox />);
    const input = view.container.querySelector('input')!;
    type(input, '神爱');
    await act(async () => vi.advanceTimersByTime(200));
    expect(pending.has('神爱')).toBe(true);
    expect(useSearchStore.getState().loading).toBe(true);
    return { view, input };
  }

  async function expectCancelled() {
    expect(useSearchStore.getState().loading).toBe(false);
    expect(useSearchStore.getState().query).toBe('');
    await act(async () => pending.get('神爱')!({ results: [hit('stale')], truncated: false }));
    expect(useSearchStore.getState().results).toEqual([]);
    expect(useSearchStore.getState().loading).toBe(false);
  }

  it('✕ cancels the in-flight search', async () => {
    const { view } = await startSlowSearch();
    fireEvent.click(view.getByLabelText('清除搜索'));
    await expectCancelled();
  });

  it('Escape cancels the in-flight search', async () => {
    const { input } = await startSlowSearch();
    fireEvent.keyDown(input, { key: 'Escape' });
    await expectCancelled();
  });

  it('✕ during the debounce drops the pending search', async () => {
    const view = render(<SearchBox />);
    type(view.container.querySelector('input')!, '神爱');
    fireEvent.click(view.getByLabelText('清除搜索'));
    await act(async () => vi.advanceTimersByTime(500));
    expect(pending.size).toBe(0);
    expect(useSearchStore.getState().loading).toBe(false);
  });
});

describe('home search spinner copy', () => {
  it('follows the UI script', () => {
    expect(getChromeCopy('simplified').searchingTitle).toBe('正在翻找经文索引');
    expect(getChromeCopy('traditional').searchingTitle).toBe('正在翻找經文索引');
    expect(getChromeCopy('traditional').searchingHint).toBe('引用會即時命中，全文搜索稍等半拍。');
    const src = fs.readFileSync(path.join(process.cwd(), 'components/home/HomePageClient.tsx'), 'utf8');
    expect(src).toContain('{chrome.searchingTitle}');
    expect(src).not.toContain('正在翻找经文索引');
  });
});
