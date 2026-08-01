import { describe, expect, it } from 'vitest';
import {
  calculateOrderedMasonry,
  estimateVerseCardHeight,
  getOrderedMasonryColumnCount,
} from '../lib/orderedMasonry';

describe('ordered masonry layout', () => {
  it('keeps source order in a single mobile column', () => {
    const layout = calculateOrderedMasonry({
      items: [
        { id: 'first', height: 100 },
        { id: 'second', height: 140 },
        { id: 'third', height: 80 },
      ],
      columnCount: 1,
      columnWidth: 343,
      gap: 16,
    });

    expect(layout.positions).toEqual([
      { id: 'first', index: 0, column: 0, x: 0, y: 0, width: 343, height: 100 },
      { id: 'second', index: 1, column: 0, x: 0, y: 116, width: 343, height: 140 },
      { id: 'third', index: 2, column: 0, x: 0, y: 272, width: 343, height: 80 },
    ]);
    expect(layout.containerHeight).toBe(352);
  });

  it('places source-ordered cards in the shortest column and breaks ties left', () => {
    const layout = calculateOrderedMasonry({
      items: [
        { id: 'a', height: 100 },
        { id: 'b', height: 100 },
        { id: 'c', height: 40 },
        { id: 'd', height: 90 },
        { id: 'e', height: 20 },
      ],
      columnCount: 2,
      columnWidth: 200,
      gap: 10,
    });

    expect(layout.positions.map(({ id, column, x, y }) => ({ id, column, x, y }))).toEqual([
      { id: 'a', column: 0, x: 0, y: 0 },
      { id: 'b', column: 1, x: 210, y: 0 },
      { id: 'c', column: 0, x: 0, y: 110 },
      { id: 'd', column: 1, x: 210, y: 110 },
      { id: 'e', column: 0, x: 0, y: 160 },
    ]);
    expect(layout.positions.map(({ id }) => id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(layout.containerHeight).toBe(200);
  });

  it('rebalances deterministically when an item grows or a card is appended', () => {
    const baseInput = {
      columnCount: 2,
      columnWidth: 180,
      gap: 12,
    };
    const before = calculateOrderedMasonry({
      ...baseInput,
      items: [
        { id: 'short', height: 80 },
        { id: 'growing', height: 90 },
        { id: 'later', height: 70 },
      ],
    });
    const after = calculateOrderedMasonry({
      ...baseInput,
      items: [
        { id: 'short', height: 80 },
        { id: 'growing', height: 180 },
        { id: 'later', height: 70 },
        { id: 'appended', height: 60 },
      ],
    });

    expect(before.positions.map(({ id, column }) => [id, column])).toEqual([
      ['short', 0],
      ['growing', 1],
      ['later', 0],
    ]);
    expect(after.positions.map(({ id, column }) => [id, column])).toEqual([
      ['short', 0],
      ['growing', 1],
      ['later', 0],
      ['appended', 0],
    ]);
    expect(after.containerHeight).toBe(234);
  });

  it('estimates more height for larger text, longer text, and narrower cards', () => {
    const baseline = estimateVerseCardHeight({ textLength: 50, size: 'medium', textScale: 1, columnWidth: 280 });

    expect(estimateVerseCardHeight({ textLength: 50, size: 'medium', textScale: 1.45, columnWidth: 280 })).toBeGreaterThan(baseline);
    expect(estimateVerseCardHeight({ textLength: 160, size: 'medium', textScale: 1, columnWidth: 280 })).toBeGreaterThan(baseline);
    expect(estimateVerseCardHeight({ textLength: 50, size: 'medium', textScale: 1, columnWidth: 180 })).toBeGreaterThan(baseline);
  });

  it('always uses one mobile column and drops a wide-layout column at 145%', () => {
    expect(getOrderedMasonryColumnCount(375, 1.45)).toBe(1);
    expect(getOrderedMasonryColumnCount(430, 0.9)).toBe(1);
    expect(getOrderedMasonryColumnCount(1024, 1)).toBe(3);
    expect(getOrderedMasonryColumnCount(1024, 1.45)).toBe(2);
    expect(getOrderedMasonryColumnCount(1440, 1)).toBe(4);
    expect(getOrderedMasonryColumnCount(1440, 1.45)).toBe(3);
  });
});
