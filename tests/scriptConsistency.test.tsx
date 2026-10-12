// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadScriptConverters, pickVerseText, queryForScript, toScript } from '../lib/search/scriptConvert';
import { applyScriptToDocument } from '../components/AppStoreStorageSync';
import LanguageToggle from '../components/search/LanguageToggle';
import SearchResultCard from '../components/search/SearchResultCard';
import { useAppStore } from '../stores/useAppStore';
import { useSearchStore } from '../stores/useSearchStore';
import type { SearchResult } from '../types/search';

const TRAD = '神愛世人，甚至將他的獨生子賜給他們';
const SIMP = '神爱世人，甚至将他的独生子赐给他们';

const pagefindResult: SearchResult = {
  id: '约翰福音-3-16',
  bookKey: '约翰福音',
  bookTraditional: '約翰福音',
  bookEnglish: 'John',
  chapter: 3,
  verse: 16,
  textChinese: TRAD,
  textSimplified: SIMP,
  textEnglish: 'For God so loved the world',
  score: 1,
  matchType: 'keyword',
};

afterEach(() => cleanup());
beforeEach(() => {
  useAppStore.setState({ language: 'simplified' });
  useSearchStore.setState({ searchLang: 'zh', query: '' });
});

describe('verse text follows the UI script', () => {
  it('picks Simplified / Traditional from Pagefind fields without conversion', () => {
    expect(pickVerseText(TRAD, SIMP, 'simplified')).toBe(SIMP);
    expect(pickVerseText(TRAD, SIMP, 'traditional')).toBe(TRAD);
  });

  it('converts Simplified-only (MiniSearch / context) text for 繁 mode, and queries for highlights', async () => {
    const conv = await loadScriptConverters();
    expect(pickVerseText(SIMP, undefined, 'traditional', conv)).toBe(TRAD);
    expect(pickVerseText(SIMP, undefined, 'simplified', conv)).toBe(SIMP);
    expect(queryForScript('神愛世人', 'simplified', conv)).toBe('神爱世人');
    expect(toScript('起初，神創造天地。', 'simplified', conv)).toBe('起初，神创造天地。');
  });

  it('renders a Simplified result card with Simplified text and a Simplified highlight (神爱世人)', async () => {
    useSearchStore.setState({ query: '神爱世人' });
    const view = render(<SearchResultCard result={pagefindResult} index={0} isSelected={false} />);
    await waitFor(() => expect(view.container.querySelector('mark')?.textContent).toBe('神爱世人'));
    expect(view.container.textContent).toContain(SIMP);
    expect(view.container.textContent).not.toContain('獨生子');
  });

  it('renders the Traditional text with a Traditional highlight in 繁 mode', async () => {
    useAppStore.setState({ language: 'traditional' });
    useSearchStore.setState({ query: '神爱世人' });
    const view = render(<SearchResultCard result={pagefindResult} index={0} isSelected={false} />);
    await waitFor(() => expect(view.container.querySelector('mark')?.textContent).toBe('神愛世人'));
    expect(view.container.textContent).toContain('約翰福音 3:16');
  });
});

describe('document script', () => {
  it('sets html lang and swaps script-aware aria-labels', () => {
    document.body.innerHTML =
      '<nav aria-label="主要页面" data-aria-label-simplified="主要页面" data-aria-label-traditional="主要頁面"></nav>';
    applyScriptToDocument('traditional');
    expect(document.documentElement.lang).toBe('zh-Hant');
    expect(document.querySelector('nav')!.getAttribute('aria-label')).toBe('主要頁面');
    applyScriptToDocument('simplified');
    expect(document.documentElement.lang).toBe('zh-Hans');
    expect(document.querySelector('nav')!.getAttribute('aria-label')).toBe('主要页面');
  });
});

describe('/search language switch', () => {
  it('offers 简 / 繁 / English and 简/繁 set the UI script', () => {
    const view = render(<LanguageToggle />);
    fireEvent.click(view.getByRole('button', { name: '繁' }));
    expect(useAppStore.getState().language).toBe('traditional');
    expect(useSearchStore.getState().searchLang).toBe('zh');
    expect(view.getByRole('button', { name: '繁' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(view.getByRole('button', { name: 'English' }));
    expect(useSearchStore.getState().searchLang).toBe('en');
    fireEvent.click(view.getByRole('button', { name: '简' }));
    expect(useAppStore.getState().language).toBe('simplified');
    expect(useSearchStore.getState().searchLang).toBe('zh');
  });
});
