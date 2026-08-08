import { describe, expect, it } from 'vitest';
import { buildContextualInitials, buildContextualPhonetics } from '../lib/memorize/contextualInitials';

describe('contextual pinyin initials', () => {
  it('computes primary readings from the complete phrase', () => {
    expect(buildContextualInitials('银行长老重复').map((initials) => initials[0])).toEqual([
      'y', 'h', 'z', 'l', 'c', 'f',
    ]);
  });

  it('accepts reasonable alternate initials for polyphonic characters', () => {
    const initials = buildContextualInitials('长');
    expect(initials[0]).toEqual(expect.arrayContaining(['c', 'z']));
  });

  it('returns initials only for Han characters', () => {
    expect(buildContextualInitials('神，2026 A爱')).toEqual([['s'], ['a']]);
  });

  it('fails safely with one empty accepted set per Han Recall Unit', () => {
    expect(buildContextualInitials('神，2026 A爱', () => {
      throw new Error('reading data unavailable');
    })).toEqual([[], []]);
  });
});

describe('contextual Zhuyin first symbols', () => {
  it('maps contextual phrase readings to the first Taiwan Zhuyin symbol', () => {
    expect(buildContextualPhonetics('银行长老重复爱').map((reading) => reading.zhuyin[0])).toEqual([
      'ㄧ', 'ㄏ', 'ㄓ', 'ㄌ', 'ㄔ', 'ㄈ', 'ㄞ',
    ]);
  });

  it('uses known Taiwan phrase readings as primary and Mainland readings as supplemental', () => {
    const readings = buildContextualPhonetics('垃圾暴露');
    expect(readings.map((reading) => reading.zhuyin[0])).toEqual(['ㄌ', 'ㄙ', 'ㄆ', 'ㄌ']);
    expect(readings[1].zhuyin.slice(1)).toContain('ㄐ');
    expect(readings[2].zhuyin.slice(1)).toContain('ㄅ');
    expect(readings.map((reading) => reading.pinyin[0])).toEqual(['l', 's', 'p', 'l']);
  });

  it('keeps reasonable polyphonic first symbols as supplemental readings', () => {
    const readings = buildContextualPhonetics('長');
    expect(readings[0].zhuyin).toEqual(expect.arrayContaining(['ㄔ', 'ㄓ']));
  });

  it('aligns phonetics only with Han Recall Units and fails safely', () => {
    expect(buildContextualPhonetics('神，2026 A愛').map((reading) => reading.zhuyin[0])).toEqual(['ㄕ', 'ㄞ']);
    expect(buildContextualPhonetics('神愛', () => {
      throw new Error('reading data unavailable');
    })).toEqual([
      { pinyin: [], zhuyin: [] },
      { pinyin: [], zhuyin: [] },
    ]);
  });
});
