import { pinyin, polyphonic } from 'pinyin-pro';

const hanPattern = /\p{Script=Han}/u;

export interface ContextualReadings {
  primary: string[];
  alternatives: string[][];
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
