import { buildContextualPhonetics, type ContextualPhoneticInput, type ContextualReadingResolver } from './contextualInitials';
import taiwanReadings from './data/taiwan-zhuyin-cuv.json';

interface TrieNode {
  [character: string]: TrieNode | string | undefined;
  $?: string;
}

// This module is dynamically imported only when the user activates Zhuyin.
// The data is a CUV/CUVT-filtered extraction of McBopomofo's MIT-licensed,
// scored Taiwan Mandarin model. See data/README.md for pinned provenance,
// checksums, license, generator, and measured transfer sizes.
const readingTrie = buildReadingTrie(taiwanReadings);

export function buildTaiwanContextualPhonetics(
  text: string,
  resolveReadings?: ContextualReadingResolver,
): ContextualPhoneticInput[] {
  const supplemental = buildContextualPhonetics(text, resolveReadings);
  const taiwanPrimary = resolveTaiwanFirstSymbols(text);
  return supplemental.map((reading, index) => ({
    pinyin: reading.pinyin,
    zhuyin: [...new Set([taiwanPrimary[index], ...reading.zhuyin]
      .filter((symbol): symbol is string => Boolean(symbol)))],
  }));
}

function buildReadingTrie(readings: Readonly<Record<string, string>>): TrieNode {
  const root: TrieNode = {};
  for (const [term, reading] of Object.entries(readings)) {
    let node = root;
    for (const character of term) {
      const child = node[character];
      if (typeof child === 'object' && child) {
        node = child;
      } else {
        const next: TrieNode = {};
        node[character] = next;
        node = next;
      }
    }
    node.$ = reading;
  }
  return root;
}

function resolveTaiwanFirstSymbols(text: string): Array<string | undefined> {
  const characters = Array.from(text);
  const aligned = new Array<string | undefined>(characters.length);
  for (let start = 0; start < characters.length; start += 1) {
    let node: TrieNode = readingTrie;
    let best: { end: number; reading: string } | undefined;
    for (let index = start; index < characters.length; index += 1) {
      const child: TrieNode | string | undefined = node[characters[index]];
      if (!child || typeof child === 'string') break;
      node = child;
      if (typeof node.$ === 'string') best = { end: index, reading: node.$ };
    }
    if (!best) continue;
    Array.from(best.reading).forEach((symbol, offset) => { aligned[start + offset] = symbol; });
    start = best.end;
  }

  return characters.flatMap((character, index) => /\p{Script=Han}/u.test(character) ? [aligned[index]] : []);
}
