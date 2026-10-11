import { describe, expect, it } from 'vitest';
import { findOffScaleOpacity, OPACITY_SCALE, scan } from '../scripts/check-tailwind-opacity.mjs';

describe('tailwind opacity guard', () => {
  it('uses the real Tailwind opacity scale', () => {
    expect(OPACITY_SCALE.has('80')).toBe(true);
    expect(OPACITY_SCALE.has('82')).toBe(false);
  });

  it('flags off-scale modifiers, including variants and arbitrary colors', () => {
    const hits = findOffScaleOpacity('className="bg-white/70 dark:bg-gray-950/82 dark:hover:border-amber-200/12 bg-[#0e1116]/72 text-bible-700/5"');
    expect(hits.map((hit: { className: string }) => hit.className)).toEqual([
      'dark:bg-gray-950/82',
      'dark:hover:border-amber-200/12',
      'bg-[#0e1116]/72',
    ]);
  });

  it('accepts on-scale and arbitrary opacity values and ignores non-class slashes', () => {
    expect(findOffScaleOpacity('bg-white/[.82] dark:bg-gray-950/[0.82] bg-black/5 w-1/3 href="/memorize/12" 1/12 grid-cols-12')).toEqual([]);
  });

  it('finds no off-scale modifiers in the app source', () => {
    expect(scan(['app', 'components', 'lib', 'stores', 'pages'])).toEqual([]);
  });
});
