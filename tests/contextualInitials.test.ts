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

  it('keeps reasonable polyphonic and Taiwan regional first symbols', () => {
    const readings = buildContextualPhonetics('長圾');
    expect(readings[0].zhuyin).toEqual(expect.arrayContaining(['ㄔ', 'ㄓ']));
    expect(readings[1].zhuyin).toEqual(expect.arrayContaining(['ㄐ', 'ㄙ']));
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
