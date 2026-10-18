export const PINYIN_SYLLABLES: Set<string>;
export function fuzzySyllable(s: string): string;
export function cleanSyllable(s: string): string;
export function segmentPinyin(input: string): string[] | null;
export function pinyinIndexTokens(syllables: string[]): string[];
export function pinyinQueryTerms(
  syllables: string[],
  typedWithoutSpaces: boolean,
): { exact: string | null; fuzzy: string | null; prefix: string | null };
