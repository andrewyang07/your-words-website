import { describe, expect, it } from 'vitest';
import {
  SEAL_CONTENT_INSET,
  SEAL_VIEWBOX_SIZE,
  sealCharacterLayout,
} from '../lib/memorize/sealLayout';

describe('sealCharacterLayout', () => {
  it.each([2, 3])('keeps comfortable vertical padding for %i-character seals', (charCount) => {
    const layout = sealCharacterLayout(charCount);

    expect(layout.paddingY).toBeGreaterThan(0);
    expect(layout.paddingY).toBeGreaterThanOrEqual(8);
  });

  it('centers the glyph column and keeps startY/step consistent', () => {
    for (const charCount of [1, 2, 3, 4, 5]) {
      const { startY, step, textSize, paddingY } = sealCharacterLayout(charCount);
      const midY = startY + ((charCount - 1) * step) / 2;
      const topExtent = startY - textSize / 2;
      const bottomExtent = startY + (charCount - 1) * step + textSize / 2;

      expect(midY).toBe(SEAL_VIEWBOX_SIZE / 2);
      expect(step).toBeGreaterThan(0);
      expect(textSize).toBeGreaterThan(0);
      expect(paddingY).toBe(
        Math.min(topExtent - SEAL_CONTENT_INSET, SEAL_VIEWBOX_SIZE - SEAL_CONTENT_INSET - bottomExtent),
      );
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
