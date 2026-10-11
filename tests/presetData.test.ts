import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PRESET_VERSE_REFERENCES } from '../lib/constants';

const read = (p: string) => JSON.parse(readFileSync(`${process.cwd()}/public/data/${p}`, 'utf8'));

describe('public/data/presets.json', () => {
  const presets = read('presets.json');
  const bibles = { simplified: read('CUV_bible.json'), traditional: read('CUVT_bible.json') };

  it('has every preset verse in both scripts, matching the full Bibles (run npm run data:presets)', () => {
    for (const [lang, bible] of Object.entries(bibles)) {
      for (const ref of PRESET_VERSE_REFERENCES) {
        const id = `${ref.book}-${ref.chapter}-${ref.verse}`;
        expect(presets[lang][id], `${lang} ${id}`).toBe(bible[ref.book][ref.chapter][ref.verse]);
      }
      expect(Object.keys(presets[lang])).toHaveLength(PRESET_VERSE_REFERENCES.length);
    }
  });
});
