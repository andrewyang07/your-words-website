import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = (p: string) => readFileSync(`${process.cwd()}/${p}`, 'utf8');

describe('/search keeps MiniSearch lazy', () => {
  it.each(['app/search/page.tsx', 'components/search/SearchBox.tsx', 'components/search/SearchResultCard.tsx'])(
    '%s does not statically import or eagerly initialize the MiniSearch engine',
    (file) => {
      const code = src(file);
      expect(code).not.toMatch(/^import .*lib\/search\/searchEngine/m);
      if (file !== 'components/search/SearchResultCard.tsx') expect(code).not.toMatch(/\.initialize\(\)/);
    },
  );

  it('the root layout ships no next/font CJK webfont', () => {
    expect(src('app/layout.tsx')).not.toMatch(/next\/font/);
  });
});
