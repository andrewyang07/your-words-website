import { describe, expect, it } from 'vitest';
import {
  SEAL_CONTENT_INSET,
  SEAL_DECORATION_PATH,
  SEAL_VIEWBOX_SIZE,
  sealCharacterLayout,
} from '../lib/memorize/sealLayout';

describe('sealCharacterLayout', () => {
  it.each([2, 3])('keeps comfortable vertical padding for %i-character seals', (charCount) => {
    const layout = sealCharacterLayout(charCount);

    expect(layout.paddingY).toBeGreaterThanOrEqual(8);
  });

  it('centers the glyph column using returned startY/step only', () => {
    for (const charCount of [1, 2, 3, 4, 5]) {
      const { startY, step, textSize } = sealCharacterLayout(charCount);
      const midY = startY + ((charCount - 1) * step) / 2;

      expect(midY).toBe(SEAL_VIEWBOX_SIZE / 2);
      expect(step).toBeGreaterThan(0);
      expect(textSize).toBeGreaterThan(0);
    }
  });

  it('uses larger type for stage-length seals than for three-character round seals', () => {
    const two = sealCharacterLayout(2);
    const three = sealCharacterLayout(3);
    const four = sealCharacterLayout(4);

    expect(two.textSize).toBeGreaterThan(three.textSize);
    expect(three.textSize).toBeGreaterThan(four.textSize);
    expect(two.step).toBeGreaterThan(three.step);
    expect(three.step).toBeGreaterThan(four.step);
  });
});

describe('SEAL_DECORATION_PATH', () => {
  it('keeps numeric coordinates inside the content inset', () => {
    const coords = [...SEAL_DECORATION_PATH.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
    expect(coords.length).toBeGreaterThan(0);

    const max = SEAL_VIEWBOX_SIZE - SEAL_CONTENT_INSET;
    for (const value of coords) {
      expect(value).toBeGreaterThanOrEqual(SEAL_CONTENT_INSET);
      expect(value).toBeLessThanOrEqual(max);
    }
  });
});
