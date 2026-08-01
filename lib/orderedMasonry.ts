export interface OrderedMasonryItem {
  id: string;
  height: number;
}

export interface OrderedMasonryPosition extends OrderedMasonryItem {
  index: number;
  column: number;
  x: number;
  y: number;
  width: number;
}

interface OrderedMasonryInput {
  items: OrderedMasonryItem[];
  columnCount: number;
  columnWidth: number;
  gap: number;
}

export interface OrderedMasonryLayout {
  positions: OrderedMasonryPosition[];
  containerHeight: number;
}

type EstimatedCardSize = 'small' | 'medium' | 'large';

interface VerseCardEstimateInput {
  textLength: number;
  size: EstimatedCardSize;
  textScale: number;
  columnWidth: number;
}

export function getOrderedMasonryColumnCount(viewportWidth: number, textScale: number): number {
  if (viewportWidth < 768) return 1;
  if (viewportWidth < 1024) return 2;

  const reduceForLargestText = textScale >= 1.45;
  if (viewportWidth < 1280) return reduceForLargestText ? 2 : 3;
  return reduceForLargestText ? 3 : 4;
}

export function estimateVerseCardHeight({
  textLength,
  size,
  textScale,
  columnWidth,
}: VerseCardEstimateInput): number {
  const basePadding = { small: 32, medium: 48, large: 64 }[size];
  const baseMinimumHeight = { small: 120, medium: 160, large: 200 }[size];
  const spaceScale = Math.min(1.15, 1 + Math.max(0, textScale - 1) / 3);
  const horizontalPadding = basePadding * spaceScale;
  const contentWidth = Math.max(80, columnWidth - horizontalPadding);
  const bodyFontSize = 16 * textScale;
  const approximateCharactersPerLine = Math.max(1, Math.floor(contentWidth / bodyFontSize));
  const lineCount = Math.max(1, Math.ceil(textLength / approximateCharactersPerLine));
  const bodyHeight = lineCount * bodyFontSize * 1.95;
  const cardChromeHeight = 112 + horizontalPadding;

  return Math.ceil(Math.max(baseMinimumHeight * spaceScale, bodyHeight + cardChromeHeight));
}

export function calculateOrderedMasonry({
  items,
  columnCount,
  columnWidth,
  gap,
}: OrderedMasonryInput): OrderedMasonryLayout {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const columnHeights = Array.from({ length: safeColumnCount }, () => 0);

  const positions = items.map((item, index) => {
    let column = 0;
    for (let candidate = 1; candidate < safeColumnCount; candidate += 1) {
      if (columnHeights[candidate] < columnHeights[column]) column = candidate;
    }

    const y = columnHeights[column];
    columnHeights[column] += item.height + gap;

    return {
      ...item,
      index,
      column,
      x: column * (columnWidth + gap),
      y,
      width: columnWidth,
    };
  });

  return {
    positions,
    containerHeight: Math.max(0, ...columnHeights) - (items.length > 0 ? gap : 0),
  };
}
