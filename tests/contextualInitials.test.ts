import { describe, expect, it } from 'vitest';
import { buildContextualInitials, buildContextualPhonetics } from '../lib/memorize/contextualInitials';
import { buildTaiwanContextualPhonetics } from '../lib/memorize/taiwanZhuyin';

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
  it.each([
    ['亞伯拉罕急忙進帳棚見撒拉', 'ㄧㄅㄌㄏㄐㄇㄐㄓㄆㄐㄙㄌ'],
    ['亚伯拉罕急忙进帐棚见撒拉', 'ㄧㄅㄌㄏㄐㄇㄐㄓㄆㄐㄙㄌ'],
    ['聖靈降臨在你們身上', 'ㄕㄌㄐㄌㄗㄋㄇㄕㄕ'],
    ['圣灵降临在你们身上', 'ㄕㄌㄐㄌㄗㄋㄇㄕㄕ'],
  ])('uses Taiwan-primary readings across sampled CUV/CUVT text: %s', async (phrase, expected) => {
    const readings = await buildTaiwanContextualPhonetics(phrase);
    expect(readings.map((reading) => reading.zhuyin[0]).join('')).toBe(expected);
  });

  it.each(['願他們像蝸牛消化過去', '愿他们像蜗牛消化过去'])('makes the known Taiwan 蝸牛 reading primary and keeps pinyin-pro supplemental: %s', async (phrase) => {
    const readings = await buildTaiwanContextualPhonetics(phrase);
    const snail = readings[4];
    expect(snail.zhuyin[0]).toBe('ㄍ');
    expect(snail.zhuyin.slice(1)).toContain('ㄨ');
    expect(snail.pinyin[0]).toBe('w');
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
