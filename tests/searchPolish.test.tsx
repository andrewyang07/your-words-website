// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AppStoreStorageSync from '../components/AppStoreStorageSync';
import SearchResults from '../components/search/SearchResults';
import { useAppStore } from '../stores/useAppStore';
import { useSearchStore } from '../stores/useSearchStore';
import type { SearchResult } from '../types/search';

const result: SearchResult = {
  id: '约翰福音-3-16',
  bookKey: '约翰福音',
  bookTraditional: '約翰福音',
  bookEnglish: 'John',
  chapter: 3,
  verse: 16,
  textChinese: '神爱世人',
  textEnglish: 'For God so loved the world',
  score: 1,
  matchType: 'keyword',
};

afterEach(() => {
  cleanup();
  useSearchStore.setState({ results: [] });
});

describe('/search keyboard hint script', () => {
  it.each([
    ['simplified', '↑↓ 导航 · Enter 复制 · Esc 清除'],
    ['traditional', '↑↓ 導航 · Enter 複製 · Esc 清除'],
  ] as const)('%s', (language, hint) => {
    useAppStore.setState({ language });
    useSearchStore.setState({ query: '神爱世人', results: [result], loading: false });
    render(<SearchResults />);
    expect(screen.getByText(hint)).toBeTruthy();
  });
});

describe('script class on <html> for TC font stack', () => {
  it('toggles script-traditional with the UI language', () => {
    useAppStore.setState({ language: 'traditional' });
    render(<AppStoreStorageSync />);
    expect(document.documentElement.classList.contains('script-traditional')).toBe(true);
    cleanup();
    useAppStore.setState({ language: 'simplified' });
    render(<AppStoreStorageSync />);
    expect(document.documentElement.classList.contains('script-traditional')).toBe(false);
  });
});
