import { describe, expect, it } from 'vitest';
import { bookMatchesFilter, getBookDisplayName, getMenuCopy } from '@/lib/uiScript';

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
});
