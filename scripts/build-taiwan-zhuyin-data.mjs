import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import * as OpenCC from 'opencc-js';

const PINNED_SOURCE_SHA256 = '7ff0f309eecefa671319cd90802b25ad797301b29838dc2a71d473c1506bdc73';
const outputPath = new URL('../lib/memorize/data/taiwan-zhuyin-cuv.json', import.meta.url);
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error('Usage: node scripts/build-taiwan-zhuyin-data.mjs /path/to/McBopomofo/Source/Data/data.txt');
}

const source = readFileSync(sourcePath, 'utf8');
const sourceSha256 = createHash('sha256').update(source).digest('hex');
if (sourceSha256 !== PINNED_SOURCE_SHA256) {
  throw new Error(`Expected pinned McBopomofo data.txt SHA-256 ${PINNED_SOURCE_SHA256}, received ${sourceSha256}`);
}

const traditionalBible = JSON.parse(readFileSync(new URL('../public/data/CUVT_bible.json', import.meta.url), 'utf8'));
const simplifiedBible = JSON.parse(readFileSync(new URL('../public/data/CUV_bible.json', import.meta.url), 'utf8'));
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' });
const hanPattern = /^\p{Script=Han}+$/u;
const bestReadings = new Map();

for (const line of source.split('\n')) {
  if (!line || line.startsWith('#') || line.startsWith('_')) continue;
  const [rawReading, term, rawScore] = line.split(' ');
  const characters = Array.from(term ?? '');
  const syllables = (rawReading ?? '').split('-');
  if (!characters.length || syllables.length !== characters.length || !hanPattern.test(term)) continue;
  const firstSymbols = syllables.map((syllable) => syllable.match(/[ㄅ-ㄩ]/u)?.[0] ?? '');
  if (firstSymbols.some((symbol) => !symbol)) continue;
  const candidate = { reading: firstSymbols.join(''), score: Number(rawScore) };
  const current = bestReadings.get(term);
  if (!current || candidate.score > current.score || (candidate.score === current.score && candidate.reading < current.reading)) {
    bestReadings.set(term, candidate);
  }
}

const candidateForms = new Map();
for (const [term, candidate] of bestReadings) {
  addBestCandidate(candidateForms, term, candidate);
  addBestCandidate(candidateForms, toSimplified(term), candidate);
}

const trie = {};
for (const term of candidateForms.keys()) {
  let node = trie;
  for (const character of term) node = node[character] ??= {};
  node.$ = term;
}

const usedTerms = new Set();
for (const verse of [...verseTexts(traditionalBible), ...verseTexts(simplifiedBible)]) {
  const characters = Array.from(verse);
  for (let start = 0; start < characters.length; start += 1) {
    let node = trie;
    for (let index = start; index < characters.length; index += 1) {
      node = node[characters[index]];
      if (!node) break;
      if (node.$) usedTerms.add(node.$);
    }
  }
}

const output = Object.fromEntries([...usedTerms]
  .sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
  .map((term) => [term, candidateForms.get(term).reading]));
const serialized = `${JSON.stringify(output)}\n`;
await writeFile(outputPath, serialized);

const bytes = Buffer.from(serialized);
const outputSha256 = createHash('sha256').update(bytes).digest('hex');
process.stdout.write(`${JSON.stringify({
  sourceSha256,
  outputSha256,
  entries: usedTerms.size,
  rawBytes: bytes.length,
  gzipBytes: gzipSync(bytes).length,
  brotliBytes: brotliCompressSync(bytes).length,
  coverage: {
    CUVT: coverageStats(output, traditionalBible),
    CUV: coverageStats(output, simplifiedBible),
  },
}, null, 2)}\n`);

function addBestCandidate(collection, term, candidate) {
  const current = collection.get(term);
  if (!current || candidate.score > current.score || (candidate.score === current.score && candidate.reading < current.reading)) {
    collection.set(term, candidate);
  }
}

function verseTexts(bible) {
  return Object.values(bible)
    .flatMap((book) => Object.values(book))
    .flatMap((chapter) => Object.values(chapter));
}

function coverageStats(readings, bible) {
  const readingTrie = {};
  for (const [term, reading] of Object.entries(readings)) {
    let node = readingTrie;
    for (const character of term) node = node[character] ??= {};
    node.$ = reading;
  }

  let hanCharacters = 0;
  let coveredHanCharacters = 0;
  for (const verse of verseTexts(bible)) {
    const characters = Array.from(verse);
    hanCharacters += characters.filter((character) => /\p{Script=Han}/u.test(character)).length;
    for (let start = 0; start < characters.length; start += 1) {
      let node = readingTrie;
      let best;
      for (let index = start; index < characters.length; index += 1) {
        node = node[characters[index]];
        if (!node) break;
        if (node.$) best = { end: index, reading: node.$ };
      }
      if (!best) continue;
      coveredHanCharacters += Array.from(best.reading).length;
      start = best.end;
    }
  }
  return {
    hanCharacters,
    coveredHanCharacters,
    percent: Number((100 * coveredHanCharacters / hanCharacters).toFixed(3)),
  };
}
