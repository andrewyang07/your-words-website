// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchPage from '../app/search/page';
import { MAX_QUERY_LENGTH } from '../lib/search/searchHelpers';
import { useSearchStore } from '../stores/useSearchStore';
import { preloadSearch } from '../lib/search/runClientSearch';

const nav = vi.hoisted(() => ({ query: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.query),
}));
vi.mock('../lib/search/runClientSearch', () => ({
  preloadSearch: vi.fn(() => Promise.resolve()),
  preloadSearchWhenIdle: () => () => {},
  runClientSearch: vi.fn(async () => ({ results: [], truncated: false })),
}));

let push: ReturnType<typeof vi.spyOn>;
let replace: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  nav.query = '';
  useSearchStore.setState({ query: '', results: [], loading: false });
  push = vi.spyOn(window.history, 'pushState');
  replace = vi.spyOn(window.history, 'replaceState');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const input = (view: ReturnType<typeof render>) => view.getByRole('textbox') as HTMLInputElement;

describe('/search URL + history', () => {
  it('pushes one history entry per committed search (not per keystroke)', async () => {
    const view = render(<SearchPage />);
    await act(async () => {});
    fireEvent.change(input(view), { target: { value: 'lo' } });
    fireEvent.change(input(view), { target: { value: 'love' } });
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    fireEvent.change(input(view), { target: { value: 'grace' } });
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    const urls = push.mock.calls.map((c: unknown[]) => c[2]);
    expect(urls).toEqual(['/search?q=love', '/search?q=grace']);
  });

  it('Esc clear removes ?q= from the URL', async () => {
    nav.query = 'q=love';
    const view = render(<SearchPage />);
    await act(async () => {});
    expect(useSearchStore.getState().query).toBe('love');
    fireEvent.keyDown(input(view), { key: 'Escape' });
    await act(async () => {});
    expect(replace).toHaveBeenCalledWith(null, '', '/search');
    expect(push).not.toHaveBeenCalled();
  });

  it('limits query length', async () => {
    const view = render(<SearchPage />);
    await act(async () => {});
    expect(input(view).maxLength).toBe(MAX_QUERY_LENGTH);
    fireEvent.change(input(view), { target: { value: 'a'.repeat(600) } });
    expect(useSearchStore.getState().query).toHaveLength(MAX_QUERY_LENGTH);
  });

  it('does not preload search on load/autofocus, only on user interaction (keeps TBT down)', async () => {
    vi.mocked(preloadSearch).mockClear();
    const view = render(<SearchPage />);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(preloadSearch).not.toHaveBeenCalled();
    fireEvent.keyDown(input(view), { key: 'l' });
    expect(preloadSearch).toHaveBeenCalled();
  });
});
