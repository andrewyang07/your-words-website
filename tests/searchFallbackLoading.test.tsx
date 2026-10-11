// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchResults from '../components/search/SearchResults';
import { useAppStore } from '../stores/useAppStore';
import { useSearchStore } from '../stores/useSearchStore';

const engine = vi.hoisted(() => ({ initialized: false }));
vi.mock('../lib/search/pagefindClient', () => ({
  searchWithPagefind: () => Promise.reject(new Error('pagefind down')),
}));
vi.mock('../lib/search/searchEngine', () => ({
  getSearchEngine: () => ({
    get initialized() {
      return engine.initialized;
    },
    initialize: async () => {
      engine.initialized = true;
    },
    searchWithMeta: async () => ({ results: [], truncated: false }),
  }),
}));

afterEach(() => {
  cleanup();
  useSearchStore.setState({ loading: false, fallbackLoading: false, query: '', results: [] });
});

describe('MiniSearch fallback loading state', () => {
  it.each([
    ['simplified', '加载中…', '首次搜索需下载经文数据'],
    ['traditional', '載入中…', '首次搜索需下載經文資料'],
  ] as const)('%s shows a script-aware loading message, not 未找到', (language, label, hint) => {
    useAppStore.setState({ language });
    useSearchStore.setState({ query: '以马内利', results: [], loading: true, fallbackLoading: true });
    render(<SearchResults />);
    expect(screen.getByRole('status').textContent).toContain(label);
    expect(screen.getByRole('status').textContent).toContain(hint);
    expect(screen.queryByText(/未找到/)).toBeNull();
  });

  it('runClientSearch reports the fallback download once, and setLoading(false) clears it', async () => {
    const { runClientSearch } = await import('../lib/search/runClientSearch');
    const onFallbackLoading = vi.fn();
    await runClientSearch('以马内利', undefined, { onFallbackLoading });
    await runClientSearch('以马内利', undefined, { onFallbackLoading });
    expect(onFallbackLoading).toHaveBeenCalledTimes(1);

    useSearchStore.setState({ loading: true, fallbackLoading: true });
    useSearchStore.getState().setLoading(false);
    expect(useSearchStore.getState().fallbackLoading).toBe(false);
  });
});
