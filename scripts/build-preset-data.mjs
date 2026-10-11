// Extract the home-page preset verses (lib/constants.ts PRESET_VERSE_REFERENCES) from the full
// CUV/CUVT Bibles into a small public/data/presets.json, so / doesn't download a whole Bible (~1.2 MB br).
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const src = read('lib/constants.ts');
const block = src.slice(src.indexOf('PRESET_VERSE_REFERENCES'));
const body = block.slice(0, block.indexOf('];'));
const refs = [...body.matchAll(/book:\s*'([^']+)',\s*chapter:\s*(\d+),\s*verse:\s*(\d+)/g)].map((m) => [
  m[1],
  m[2],
  m[3],
]);
if (refs.length === 0) throw new Error('no PRESET_VERSE_REFERENCES found');

const pick = (bible) => {
  const out = {};
  for (const [book, chapter, verse] of refs) {
    const text = bible[book]?.[chapter]?.[verse];
    if (text) out[`${book}-${chapter}-${verse}`] = text;
  }
  return out;
};

const data = {
  simplified: pick(JSON.parse(read('public/data/CUV_bible.json'))),
  traditional: pick(JSON.parse(read('public/data/CUVT_bible.json'))),
};
writeFileSync(new URL('../public/data/presets.json', import.meta.url), `${JSON.stringify(data)}\n`);
console.log(`presets.json: ${refs.length} refs, ${Object.keys(data.simplified).length} verses`);
