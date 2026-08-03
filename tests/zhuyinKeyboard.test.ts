import { describe, expect, it } from 'vitest';
import { DA_CHEN_ZHUYIN_ROWS, zhuyinForPhysicalKey } from '../lib/memorize/zhuyinKeyboard';

describe('Taiwan Standard DaChen keyboard', () => {
  it('contains exactly the 37 Zhuyin symbols and no tone marks', () => {
    const symbols = DA_CHEN_ZHUYIN_ROWS.flat().map(({ symbol }) => symbol);

    expect(symbols).toHaveLength(37);
    expect(new Set(symbols).size).toBe(37);
    expect(symbols).toEqual(Array.from('ㄅㄉㄓㄚㄞㄢㄦㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ'));
    expect(symbols.some((symbol) => ['ˊ', 'ˇ', 'ˋ', '˙'].includes(symbol))).toBe(false);
  });

  it('maps every standard physical key and rejects omitted tone keys', () => {
    const expected = {
      '1': 'ㄅ', '2': 'ㄉ', '5': 'ㄓ', '8': 'ㄚ', '9': 'ㄞ', '0': 'ㄢ', '-': 'ㄦ',
      q: 'ㄆ', w: 'ㄊ', e: 'ㄍ', r: 'ㄐ', t: 'ㄔ', y: 'ㄗ', u: 'ㄧ', i: 'ㄛ', o: 'ㄟ', p: 'ㄣ',
      a: 'ㄇ', s: 'ㄋ', d: 'ㄎ', f: 'ㄑ', g: 'ㄕ', h: 'ㄘ', j: 'ㄨ', k: 'ㄜ', l: 'ㄠ', ';': 'ㄤ',
      z: 'ㄈ', x: 'ㄌ', c: 'ㄏ', v: 'ㄒ', b: 'ㄖ', n: 'ㄙ', m: 'ㄩ', ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ',
    } as const;

    for (const [physicalKey, symbol] of Object.entries(expected)) {
      expect(zhuyinForPhysicalKey(physicalKey)).toBe(symbol);
      expect(zhuyinForPhysicalKey(physicalKey.toLocaleUpperCase())).toBe(symbol);
    }
    for (const toneKey of ['3', '4', '6', '7', ' ']) {
      expect(zhuyinForPhysicalKey(toneKey)).toBeNull();
    }
  });
});
