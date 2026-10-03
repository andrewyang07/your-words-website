// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as OpenCC from 'opencc-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AboutPageClient from '../app/about/AboutPageClient';
import { useAppStore } from '../stores/useAppStore';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

// A small, deliberately obvious set of characters that exist only in Traditional Chinese.
const TRADITIONAL_ONLY = [...'話語關於聖經節項簡開發載獻誕與聯繫給個倉庫報錄來為這們讓過進運動選擇'];
const toSimplified = OpenCC.Converter({ from: 'hk', to: 'cn' });

/** Page text without the side-menu dialog, whose language picker legitimately shows the name 繁體中文. */
function pageText(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[role="dialog"]').forEach((node) => node.remove());
  return clone.textContent ?? '';
}

function altAndTitleText(container: HTMLElement): string {
  return Array.from(container.querySelectorAll('[alt],[title],[aria-label]'))
    .flatMap((el) => [el.getAttribute('alt'), el.getAttribute('title'), el.getAttribute('aria-label')])
    .filter(Boolean)
    .join(' ');
}

beforeEach(() => {
  useAppStore.persist.setOptions({ storage: undefined });
  useAppStore.setState({ language: 'traditional', theme: 'light' });
});

afterEach(() => cleanup());

describe('About page 简/繁', () => {
  it('shows Traditional copy by default (guards the test against passing vacuously)', () => {
    const view = render(<AboutPageClient />);

    const text = pageText(view.container);
    expect(TRADITIONAL_ONLY.some((char) => text.includes(char))).toBe(true);
    expect(text).toContain('項目簡介');
  });

  it('has no Traditional-only characters left after switching to 简体', () => {
    const view = render(<AboutPageClient />);

    fireEvent.click(view.getByRole('button', { name: '打開選單' }));
    fireEvent.click(view.getByRole('button', { name: /简体中文/ }));
    expect(useAppStore.getState().language).toBe('simplified');

    const text = pageText(view.container);
    expect(text).toContain('项目简介');
    expect(TRADITIONAL_ONLY.filter((char) => text.includes(char))).toEqual([]);
    // Full converter check: converting Traditional -> Simplified must be a no-op on the rendered page.
    expect(toSimplified(text)).toBe(text);

    const attributes = altAndTitleText(view.container);
    expect(TRADITIONAL_ONLY.filter((char) => attributes.includes(char))).toEqual([]);
  });
});
