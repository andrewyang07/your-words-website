// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchLayout from '../app/search/layout';
import SearchPage from '../app/search/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

afterEach(cleanup);

describe('/search headings', () => {
  it('renders exactly one H1 (layout sr-only) with the page heading as h2', () => {
    const { container } = render(
      <SearchLayout>
        <SearchPage />
      </SearchLayout>,
    );
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.closest('.sr-only')).not.toBeNull();
    expect(container.querySelector('h2.font-chinese.text-4xl')).not.toBeNull();
  });
});
