export const PINYIN_SYLLABLES: Set<string>;
export function fuzzySyllable(s: string): string;
export function cleanSyllable(s: string): string;
export function segmentPinyin(input: string): string[] | null;
export function pinyinIndexTokens(positions: (string | string[])[], wordIds?: number[]): string[];
export type InitialsReading = { initials: string; syllables: string[] };
export function initialsReadings(input: string): InitialsReading[];
export function initialsQueryTerm(reading: InitialsReading): string;
export function pinyinQueryTerms(
  syllables: string[],
  typedWithoutSpaces: boolean,
): { exact: string | null; fuzzy: string | null; prefix: string | null; word: string | null };
