import { pinyin, polyphonic } from 'pinyin-pro';

const hanPattern = /\p{Script=Han}/u;

export function buildContextualInitials(text: string): string[][] {
  const characters = Array.from(text);
  const primary = pinyin(text, { toneType: 'none', type: 'array' });
  const alternatives = polyphonic(text, { toneType: 'none', type: 'array' });

  return characters.flatMap((character, index) => {
    if (!hanPattern.test(character)) return [];
    const reading = primary[index] ?? '';
    const initials = [reading, ...(alternatives[index] ?? [])]
      .map((value) => value[0]?.toLocaleLowerCase())
      .filter((value): value is string => Boolean(value));
    return [[...new Set(initials)]];
  });
}
