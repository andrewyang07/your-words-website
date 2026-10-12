// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VerseCard from '../components/verses/VerseCard';
import { useAppStore } from '../stores/useAppStore';
import type { Verse } from '../types/verse';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => cleanup());

const verse: Verse = {
  id: '约翰福音-3-16',
  book: '約翰福音',
  bookKey: '约翰福音',
  chapter: 3,
  verse: 16,
  text: '神愛世人。',
  testament: 'new',
};

describe('verse card aria-labels follow the UI script (shared /?s= cards)', () => {
  it('uses Traditional labels in 繁 mode', () => {
    useAppStore.setState({ language: 'traditional' });
    const view = render(<VerseCard verse={verse} onViewInBible={() => {}} />);
    expect(view.getByRole('article').getAttribute('aria-label')).toBe('約翰福音 3章16節，已收起，按Enter或空格鍵切換');
    expect(view.getByRole('button', { name: '查看 約翰福音 第3章所有經文' })).toBeTruthy();
  });

  it('uses Simplified labels in 简 mode', () => {
    useAppStore.setState({ language: 'simplified' });
    const view = render(<VerseCard verse={{ ...verse, book: '约翰福音' }} onViewInBible={() => {}} />);
    expect(view.getByRole('article').getAttribute('aria-label')).toContain('16节，已收起，按Enter或空格键切换');
    expect(view.getByRole('button', { name: '查看 约翰福音 第3章所有经文' })).toBeTruthy();
  });
});
