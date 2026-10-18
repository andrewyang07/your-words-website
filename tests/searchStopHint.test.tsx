// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SearchResults from '../components/search/SearchResults';
import { isOnlyStopTerms, moreWordsHint } from '../lib/search/searchHelpers';
import { useAppStore } from '../stores/useAppStore';
import { useSearchStore } from '../stores/useSearchStore';

afterEach(() => {
  cleanup();
  useSearchStore.setState({ query: '', results: [], loading: false });
  useAppStore.setState({ language: 'simplified' });
});

const show = (query: string) => {
  useSearchStore.setState({ query, results: [], loading: false });
  render(<SearchResults />);
};

describe('stop-term-only empty results hint', () => {
  it('detects stop-only queries', () => {
    expect(isOnlyStopTerms('的')).toBe(true);
    expect(isOnlyStopTerms('的的')).toBe(true);
    expect(isOnlyStopTerms('of the')).toBe(true);
    expect(isOnlyStopTerms('的人')).toBe(false);
    expect(isOnlyStopTerms('the lord')).toBe(false);
    expect(moreWordsHint('the', false)).toBe('Please type a few more words');
  });

  it('的 → 请多输入几个字 (Traditional: 請多輸入幾個字)', () => {
    show('的');
    expect(screen.getByText('请多输入几个字')).toBeTruthy();
    expect(screen.getByText('未找到相关经文')).toBeTruthy();
    cleanup();
    useAppStore.setState({ language: 'traditional' });
    show('的');
    expect(screen.getByText('請多輸入幾個字')).toBeTruthy();
  });

  it('the → Please type a few more words', () => {
    show('the');
    expect(screen.getByText('Please type a few more words')).toBeTruthy();
  });

  it('other empty queries keep the usual hint', () => {
    show('不存在的词语组合');
    expect(screen.queryByText('请多输入几个字')).toBeNull();
    expect(screen.getByText(/试试其他关键词/)).toBeTruthy();
  });
});
