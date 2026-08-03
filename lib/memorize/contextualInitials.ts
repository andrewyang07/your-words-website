import { pinyin, polyphonic } from 'pinyin-pro';

const hanPattern = /\p{Script=Han}/u;

export interface ContextualReadings {
  primary: string[];
  alternatives: string[][];
}

export interface ContextualPhoneticInput {
  pinyin: string[];
  zhuyin: string[];
}

export type ContextualReadingResolver = (text: string) => ContextualReadings;

const resolvePinyinReadings: ContextualReadingResolver = (text) => ({
  primary: pinyin(text, { toneType: 'none', type: 'array' }),
  alternatives: polyphonic(text, { toneType: 'none', type: 'array' }),
});

export function buildContextualInitials(
  text: string,
  resolveReadings: ContextualReadingResolver = resolvePinyinReadings,
): string[][] {
  const characters = Array.from(text);
  let readings: ContextualReadings;
  try {
    readings = resolveReadings(text);
  } catch {
    return characters.filter((character) => hanPattern.test(character)).map(() => []);
  }

  return characters.flatMap((character, index) => {
    if (!hanPattern.test(character)) return [];
    const reading = readings.primary[index] ?? '';
    const initials = [reading, ...(readings.alternatives[index] ?? [])]
      .map((value) => value[0]?.toLocaleLowerCase())
      .filter((value): value is string => Boolean(value));
    return [[...new Set(initials)]];
  });
}

const zhuyinConsonants: ReadonlyArray<readonly [string, string]> = [
  ['zh', 'ㄓ'], ['ch', 'ㄔ'], ['sh', 'ㄕ'],
  ['b', 'ㄅ'], ['p', 'ㄆ'], ['m', 'ㄇ'], ['f', 'ㄈ'],
  ['d', 'ㄉ'], ['t', 'ㄊ'], ['n', 'ㄋ'], ['l', 'ㄌ'],
  ['g', 'ㄍ'], ['k', 'ㄎ'], ['h', 'ㄏ'],
  ['j', 'ㄐ'], ['q', 'ㄑ'], ['x', 'ㄒ'],
  ['r', 'ㄖ'], ['z', 'ㄗ'], ['c', 'ㄘ'], ['s', 'ㄙ'],
];

const zhuyinZeroInitials: ReadonlyArray<readonly [string, string]> = [
  ['ang', 'ㄤ'], ['eng', 'ㄥ'], ['ai', 'ㄞ'], ['ei', 'ㄟ'], ['ao', 'ㄠ'], ['ou', 'ㄡ'],
  ['an', 'ㄢ'], ['en', 'ㄣ'], ['er', 'ㄦ'], ['a', 'ㄚ'], ['o', 'ㄛ'], ['ê', 'ㄝ'], ['e', 'ㄜ'],
];

// The first symbol differs from Mainland-oriented dictionaries for a small
// number of common Taiwan readings. Keep these additions explicit and local;
// this is recall tolerance, not a complete pronunciation dictionary.
const taiwanAlternateFirstSymbols: Readonly<Record<string, readonly string[]>> = {
  '圾': ['ㄙ'], // 垃圾: lè sè in Taiwan Mandarin; Mainland dictionaries commonly return jī.
};

export function buildContextualPhonetics(
  text: string,
  resolveReadings: ContextualReadingResolver = resolvePinyinReadings,
): ContextualPhoneticInput[] {
  const characters = Array.from(text);
  let readings: ContextualReadings;
  try {
    readings = resolveReadings(text);
  } catch {
    return characters.filter((character) => hanPattern.test(character)).map(() => ({ pinyin: [], zhuyin: [] }));
  }

  return characters.flatMap((character, index) => {
    if (!hanPattern.test(character)) return [];
    const syllables = [readings.primary[index] ?? '', ...(readings.alternatives[index] ?? [])];
    const pinyinInitials = syllables
      .map((value) => value[0]?.toLocaleLowerCase())
      .filter((value): value is string => Boolean(value));
    const zhuyinInitials = syllables
      .map(firstZhuyinSymbol)
      .filter((value): value is string => Boolean(value));
    return [{
      pinyin: [...new Set(pinyinInitials)],
      zhuyin: [...new Set([...zhuyinInitials, ...(taiwanAlternateFirstSymbols[character] ?? [])])],
    }];
  });
}

export function firstZhuyinSymbol(rawSyllable: string): string | null {
  const syllable = rawSyllable.toLocaleLowerCase().replaceAll('u:', 'v').replaceAll('ü', 'v');
  if (!syllable) return null;
  for (const [prefix, symbol] of zhuyinConsonants) {
    if (syllable.startsWith(prefix)) return symbol;
  }
  if (syllable.startsWith('yu')) return 'ㄩ';
  if (syllable.startsWith('y')) return 'ㄧ';
  if (syllable.startsWith('w')) return 'ㄨ';
  if (syllable.startsWith('v')) return 'ㄩ';
  for (const [prefix, symbol] of zhuyinZeroInitials) {
    if (syllable.startsWith(prefix)) return symbol;
  }
  return null;
}
