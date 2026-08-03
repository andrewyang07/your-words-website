export interface ZhuyinKey {
  physicalKey: string;
  symbol: string;
}

// Taiwan Standard / DaChen key positions, grouped by the four physical rows.
// Tone keys (3, 4, 6, 7 and Space) are intentionally absent because recall
// consumes only the first phonetic symbol.
export const DA_CHEN_ZHUYIN_ROWS: readonly (readonly ZhuyinKey[])[] = [
  [
    { physicalKey: '1', symbol: 'ㄅ' }, { physicalKey: '2', symbol: 'ㄉ' },
    { physicalKey: '5', symbol: 'ㄓ' }, { physicalKey: '8', symbol: 'ㄚ' },
    { physicalKey: '9', symbol: 'ㄞ' }, { physicalKey: '0', symbol: 'ㄢ' },
    { physicalKey: '-', symbol: 'ㄦ' },
  ],
  [
    { physicalKey: 'q', symbol: 'ㄆ' }, { physicalKey: 'w', symbol: 'ㄊ' },
    { physicalKey: 'e', symbol: 'ㄍ' }, { physicalKey: 'r', symbol: 'ㄐ' },
    { physicalKey: 't', symbol: 'ㄔ' }, { physicalKey: 'y', symbol: 'ㄗ' },
    { physicalKey: 'u', symbol: 'ㄧ' }, { physicalKey: 'i', symbol: 'ㄛ' },
    { physicalKey: 'o', symbol: 'ㄟ' }, { physicalKey: 'p', symbol: 'ㄣ' },
  ],
  [
    { physicalKey: 'a', symbol: 'ㄇ' }, { physicalKey: 's', symbol: 'ㄋ' },
    { physicalKey: 'd', symbol: 'ㄎ' }, { physicalKey: 'f', symbol: 'ㄑ' },
    { physicalKey: 'g', symbol: 'ㄕ' }, { physicalKey: 'h', symbol: 'ㄘ' },
    { physicalKey: 'j', symbol: 'ㄨ' }, { physicalKey: 'k', symbol: 'ㄜ' },
    { physicalKey: 'l', symbol: 'ㄠ' }, { physicalKey: ';', symbol: 'ㄤ' },
  ],
  [
    { physicalKey: 'z', symbol: 'ㄈ' }, { physicalKey: 'x', symbol: 'ㄌ' },
    { physicalKey: 'c', symbol: 'ㄏ' }, { physicalKey: 'v', symbol: 'ㄒ' },
    { physicalKey: 'b', symbol: 'ㄖ' }, { physicalKey: 'n', symbol: 'ㄙ' },
    { physicalKey: 'm', symbol: 'ㄩ' }, { physicalKey: ',', symbol: 'ㄝ' },
    { physicalKey: '.', symbol: 'ㄡ' }, { physicalKey: '/', symbol: 'ㄥ' },
  ],
] as const;

const physicalKeyMap = new Map(
  DA_CHEN_ZHUYIN_ROWS.flat().map(({ physicalKey, symbol }) => [physicalKey, symbol]),
);

export function zhuyinForPhysicalKey(key: string): string | null {
  return physicalKeyMap.get(key.toLocaleLowerCase()) ?? null;
}
