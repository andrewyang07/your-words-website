import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import SearchPage from '../app/search/page';

// During static prerender Next's useSearchParams bails out (throws) up to the nearest Suspense boundary.
// Simulate that: the page shell (header, heading, search box) must still be server-rendered, otherwise
// it appears only after hydration and shifts the layout below it (CLS regression).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => {
    throw new Error('Bail out to client rendering: useSearchParams()');
  },
}));

describe('/search server render', () => {
  it('keeps the search shell when useSearchParams bails out', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const html = renderToString(<SearchPage />);
    expect(html).toMatch(/<input[^>]*type="text"/);
    expect(html).toContain('圣经搜索');
    expect(html).toContain('<header');
  });
});
