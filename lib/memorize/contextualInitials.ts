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
  return buildContextualPhonetics(text, resolveReadings).map((reading) => reading.pinyin);
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

// Taiwan Mandarin is the primary pronunciation source for Zhuyin recall.
// Phrase readings below are transcribed (without definitions) from Taiwan's
// Ministry of Education Revised Mandarin Dictionary and are deliberately
// phrase-scoped so a character's unrelated readings are not overwritten.
// Sources checked 2026-08-08:
// 垃圾 ㄌㄜˋ ㄙㄜˋ — https://dict.revised.moe.edu.tw/dictView.jsp?ID=59361&la=0&powerMode=0
// 暴露 ㄆㄨˋ ㄌㄨˋ — https://dict.revised.moe.edu.tw/dictView.jsp?ID=24286&ver=4
// pinyin-pro remains the contextual fallback and supplies supplemental
// regional/polyphonic readings after the Taiwan primary reading.
const taiwanMoePhraseReadings: Readonly<Record<string, readonly string[]>> = {
  '垃圾': ['le', 'se'],
  '暴露': ['pu', 'lu'],
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

  const taiwanPrimary = applyTaiwanPhraseReadings(characters, readings.primary);
  return characters.flatMap((character, index) => {
    if (!hanPattern.test(character)) return [];
    const syllables = [
      taiwanPrimary[index] ?? '',
      readings.primary[index] ?? '',
      ...(readings.alternatives[index] ?? []),
    ];
    const pinyinInitials = syllables
      .map((value) => value[0]?.toLocaleLowerCase())
      .filter((value): value is string => Boolean(value));
    const zhuyinInitials = syllables
      .map(firstZhuyinSymbol)
      .filter((value): value is string => Boolean(value));
    return [{
      pinyin: [...new Set(pinyinInitials)],
      zhuyin: [...new Set(zhuyinInitials)],
    }];
  });
}

function applyTaiwanPhraseReadings(characters: string[], fallback: string[]): string[] {
  const resolved = [...fallback];
  const phrases = Object.entries(taiwanMoePhraseReadings)
    .sort(([left], [right]) => Array.from(right).length - Array.from(left).length);

  for (const [phrase, syllables] of phrases) {
    const phraseCharacters = Array.from(phrase);
    for (let start = 0; start <= characters.length - phraseCharacters.length; start += 1) {
      if (!phraseCharacters.every((character, offset) => characters[start + offset] === character)) continue;
      syllables.forEach((syllable, offset) => { resolved[start + offset] = syllable; });
    }
  }
  return resolved;
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
