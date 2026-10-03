import { describe, expect, it } from 'vitest';
import {
  bookMatchesFilter,
  getBookDisplayName,
  getChromeCopy,
  getDocumentTitle,
  getMenuCopy,
  getTestamentLabel,
  pickScript,
} from '@/lib/uiScript';

describe('uiScript', () => {
  it('returns Simplified or Traditional book labels', () => {
    expect(getBookDisplayName('创世记', 'simplified')).toBe('创世记');
    expect(getBookDisplayName('创世记', 'traditional')).toBe('創世記');
    expect(getBookDisplayName('創世記', 'simplified')).toBe('创世记');
    expect(
      getBookDisplayName(
        { key: '约翰福音', nameSimplified: '约翰福音', nameTraditional: '約翰福音' },
        'traditional'
      )
    ).toBe('約翰福音');
  });

  it('matches verse book fields against a book record', () => {
    const book = {
      key: '创世记',
      name: '創世記',
      nameSimplified: '创世记',
      nameTraditional: '創世記',
    };
    expect(bookMatchesFilter('創世記', '创世记', book)).toBe(true);
    expect(bookMatchesFilter('创世记', undefined, book)).toBe(true);
    expect(bookMatchesFilter('出埃及记', '出埃及记', book)).toBe(false);
  });

  it('keeps menu chrome consistent per script', () => {
    expect(getMenuCopy('simplified').memorize).toBe('背经文');
    expect(getMenuCopy('traditional').memorize).toBe('背經文');
    expect(getMenuCopy('simplified').search).toBe('经文搜索');
    expect(getMenuCopy('traditional').search).toBe('經文搜索');
  });

  it('returns testament labels per script', () => {
    expect(getTestamentLabel('old', 'simplified')).toBe('旧约');
    expect(getTestamentLabel('old', 'traditional')).toBe('舊約');
    expect(getTestamentLabel('new', 'simplified')).toBe('新约');
    expect(getTestamentLabel('new', 'traditional')).toBe('新約');
  });

  it('keeps shared chrome strings consistent per script', () => {
    expect(getChromeCopy('simplified').loadMore).toBe('加载更多');
    expect(getChromeCopy('traditional').loadMore).toBe('載入更多');
    expect(getChromeCopy('simplified').blessing).toBe('愿神的话语常在你心中');
    expect(getChromeCopy('traditional').blessing).toBe('願神的話語常在你心中');
    expect(getChromeCopy('simplified').notePlaceholder).toBe('开始记录今天的灵修笔记…');
    expect(getChromeCopy('traditional').notePlaceholder).toBe('開始記錄今天的靈修筆記…');
  });
});

describe('script picking helpers', () => {
  it('picks the Traditional or Simplified variant', () => {
    expect(pickScript('traditional', '關於', '关于')).toBe('關於');
    expect(pickScript('simplified', '關於', '关于')).toBe('关于');
  });

  it('builds brand-suffixed document titles per script', () => {
    const title = { traditional: '聖經筆記本', simplified: '圣经笔记本' };
    expect(getDocumentTitle('traditional', title)).toBe('聖經筆記本 | 你的話語');
    expect(getDocumentTitle('simplified', title)).toBe('圣经笔记本 | 你的话语');
    expect(getDocumentTitle('simplified', title, true)).toBe('圣经笔记本');
  });
});
