/** ViewBox size for the completion seal SVG. */
export const SEAL_VIEWBOX_SIZE = 120;

/**
 * Square border geometry in viewBox units.
 * Stroke is centered on the rect path, so the inner content edge is
 * `SEAL_BORDER.x + SEAL_BORDER.strokeWidth / 2`.
 */
export const SEAL_BORDER = {
  x: 12,
  y: 12,
  width: 96,
  height: 96,
  strokeWidth: 5,
  rx: 5,
} as const;

/** Inner edge of the border stroke; glyphs and decoration must stay inside. */
export const SEAL_CONTENT_INSET =
  SEAL_BORDER.x + SEAL_BORDER.strokeWidth / 2;

export interface SealCharacterLayout {
  textSize: number;
  step: number;
  startY: number;
  /** Approximate vertical padding from glyph extent to the inner border edge. */
  paddingY: number;
}

/**
 * Vertical character layout for the completion seal.
 * Sized so 2- and 3-character seals keep comfortable internal padding
 * inside a stable square border.
 */
export function sealCharacterLayout(charCount: number): SealCharacterLayout {
  const n = Math.max(1, Math.floor(charCount));
  let textSize: number;
  let step: number;

  if (n >= 4) {
    textSize = 18;
    step = 20;
  } else if (n === 3) {
    textSize = 22;
    step = 24;
  } else {
    // 1–2 characters (stage seals are two characters)
    textSize = 26;
    step = 30;
  }

  const startY = SEAL_VIEWBOX_SIZE / 2 - ((n - 1) * step) / 2;
  const topExtent = startY - textSize / 2;
  const bottomExtent = startY + (n - 1) * step + textSize / 2;
  const paddingY = Math.min(
    topExtent - SEAL_CONTENT_INSET,
    SEAL_VIEWBOX_SIZE - SEAL_CONTENT_INSET - bottomExtent,
  );

  return { textSize, step, startY, paddingY };
}
