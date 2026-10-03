// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, configure, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { runClientSearch } from '../lib/search/runClientSearch';
import { getSearchEngine } from '../lib/search/searchEngine';
import { useAppStore } from '../stores/useAppStore';
import { useSearchStore } from '../stores/useSearchStore';
import SearchPage from '../app/search/page';

// Serve the real bundled Bible JSON from public/data instead of the network, so the test exercises the
// real corpus (Simplified CUV) with a Traditional query — the case that regressed.
vi.mock('../lib/bibleDataCache', () => ({
  fetchWithCache: async (url: string) =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', url), 'utf8')),
}));

const navigation = vi.hoisted(() => ({ query: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

// Indexing ~31k verses takes a few seconds; CI runners can be several times slower.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
configure({ asyncUtilTimeout: 30_000 });

beforeAll(async () => {
  await getSearchEngine().initialize();
});

beforeEach(() => {
  useAppStore.setState({ language: 'traditional' });
  useSearchStore.setState({ query: '', results: [], loading: false });
});

afterEach(() => {
  cleanup();
  navigation.query = '';
});

describe('searching 神愛世人 (Traditional query against the Simplified corpus)', () => {
  it('ranks 約翰福音 3:16 first via runClientSearch', async () => {
    const { results } = await runClientSearch('神愛世人');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({ bookTraditional: '約翰福音', chapter: 3, verse: 16 });
  });

  it('returns the same top verse for the Simplified spelling', async () => {
    const { results } = await runClientSearch('神爱世人');

    expect(results[0]).toMatchObject({ bookKey: '约翰福音', chapter: 3, verse: 16 });
  });

  it('shows 約翰福音 3:16 on /search?q=神愛世人', async () => {
    navigation.query = 'q=神愛世人';

    const view = render(<SearchPage />);

    await waitFor(() => expect(view.container.textContent).toContain('約翰福音'));
    await waitFor(() => expect(view.container.textContent).toMatch(/約翰福音\s*3:16/));
  });
});
