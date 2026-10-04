// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import * as OpenCC from 'opencc-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotFound, { metadata } from '../app/not-found';
import { useAppStore } from '../stores/useAppStore';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const TRADITIONAL_ONLY = [...'話語關於聖經節項簡開發頁網這們讓過進運動選擇願覽'];
const toSimplified = OpenCC.Converter({ from: 'hk', to: 'cn' });

/** Page text without the side-menu dialog, whose language picker legitimately shows the name 繁體中文. */
function pageText(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[role="dialog"]').forEach((node) => node.remove());
  return clone.textContent ?? '';
}

function attributeText(container: HTMLElement): string {
  return Array.from(container.querySelectorAll('[alt],[title],[aria-label]'))
    .flatMap((el) => [el.getAttribute('alt'), el.getAttribute('title'), el.getAttribute('aria-label')])
    .filter(Boolean)
    .join(' ');
}

function hrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('main a')).map((a) => a.getAttribute('href') ?? '');
}

beforeEach(() => {
  useAppStore.persist.setOptions({ storage: undefined });
  useAppStore.setState({ language: 'traditional', theme: 'light' });
  document.title = '';
});

afterEach(() => cleanup());

describe('custom 404 page', () => {
  it('renders Traditional copy, links and tab title by default', () => {
    const view = render(<NotFound />);

    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('找不到這個頁面');
    expect(pageText(view.container)).toContain('回到首頁');
    expect(hrefs(view.container)).toEqual(['/', '/search', '/memorize', '/rankings']);
    expect(document.title).toBe('找不到頁面 | 你的話語');
  });

  it('renders Simplified copy with no Traditional-only characters', () => {
    useAppStore.setState({ language: 'simplified' });
    const view = render(<NotFound />);

    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('找不到这个页面');
    const text = pageText(view.container);
    expect(text).toContain('回到首页');
    expect(TRADITIONAL_ONLY.filter((char) => text.includes(char))).toEqual([]);
    // Full converter check: converting Traditional -> Simplified must be a no-op on the rendered page.
    expect(toSimplified(text)).toBe(text);
    const attributes = attributeText(view.container);
    expect(TRADITIONAL_ONLY.filter((char) => attributes.includes(char))).toEqual([]);
    expect(toSimplified(attributes)).toBe(attributes);
    expect(hrefs(view.container)).toEqual(['/', '/search', '/memorize', '/rankings']);
    expect(document.title).toBe('找不到页面 | 你的话语');
  });

  it('switches script and tab title through the side menu language picker', () => {
    const view = render(<NotFound />);

    fireEvent.click(view.getByRole('button', { name: '打開選單' }));
    fireEvent.click(view.getByRole('button', { name: /简体中文/ }));

    expect(useAppStore.getState().language).toBe('simplified');
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('找不到这个页面');
    expect(document.title).toBe('找不到页面 | 你的话语');
  });

  it('re-applies the script title when the language changes after render', () => {
    render(<NotFound />);
    act(() => useAppStore.setState({ language: 'simplified' }));
    expect(document.title).toBe('找不到页面 | 你的话语');
  });

  it('marks the page noindex', () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
