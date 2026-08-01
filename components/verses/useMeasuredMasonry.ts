'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { VERSE_MASONRY_GAP } from '@/lib/constants';
import { calculateOrderedMasonry, estimateVerseCardHeight, getOrderedMasonryColumnCount } from '@/lib/orderedMasonry';
import { getReaderTextScale, type ReaderTextSize } from '@/lib/readerPreferences';
import { getCardSize } from '@/lib/utils';
import type { Verse } from '@/types/verse';

interface HeightMeasurement { height: number; layoutKey: string }

function useViewportWidth() {
  const frameRef = useRef<number | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        setWidth(window.innerWidth);
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);
  return width;
}

function useContainerWidth(containerRef: RefObject<HTMLDivElement | null>) {
  const frameRef = useRef<number | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setWidth((current) => Math.abs(current - entry.contentRect.width) > 0.5 ? entry.contentRect.width : current);
      });
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [containerRef]);
  return width;
}

function recordMeasurements(entries: ResizeObserverEntry[], cache: Map<string, HeightMeasurement>, layoutKey: string) {
  let changed = false;
  for (const entry of entries) {
    const id = (entry.target as HTMLElement).dataset.masonryId;
    if (!id) continue;
    const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height;
    const previous = cache.get(id);
    if (previous?.layoutKey === layoutKey && Math.abs(previous.height - height) <= 0.5) continue;
    cache.set(id, { height, layoutKey });
    changed = true;
  }
  return changed;
}

function useCardHeightMeasurements(containerRef: RefObject<HTMLDivElement | null>, layoutKey: string, verseKey: string, enabled: boolean) {
  const cacheRef = useRef(new Map<string, HeightMeasurement>());
  const frameRef = useRef<number | null>(null);
  const [measurements, setMeasurements] = useState<Map<string, HeightMeasurement>>(() => new Map());
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;
    const observer = new ResizeObserver((entries) => {
      if (!recordMeasurements(entries, cacheRef.current, layoutKey) || frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        setMeasurements(new Map(cacheRef.current));
      });
    });
    container.querySelectorAll<HTMLElement>('[data-masonry-id]').forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [containerRef, enabled, layoutKey, verseKey]);
  return measurements;
}

export function useMeasuredMasonry(containerRef: RefObject<HTMLDivElement | null>, verses: Verse[], textSize: ReaderTextSize) {
  const viewportWidth = useViewportWidth();
  const containerWidth = useContainerWidth(containerRef);
  const textScale = getReaderTextScale(textSize);
  const columnCount = getOrderedMasonryColumnCount(viewportWidth, textScale);
  const columnWidth = containerWidth > 0 ? (containerWidth - VERSE_MASONRY_GAP * (columnCount - 1)) / columnCount : 0;
  const layoutKey = `${Math.round(columnWidth * 10) / 10}:${textSize}`;
  const verseKey = verses.map((verse) => verse.id).join('|');
  const measurements = useCardHeightMeasurements(containerRef, layoutKey, verseKey, columnWidth > 0);
  return useMemo(() => calculateOrderedMasonry({
    items: verses.map((verse) => ({ id: verse.id, height: measurements.get(verse.id)?.layoutKey === layoutKey
      ? measurements.get(verse.id)!.height
      : estimateVerseCardHeight({ textLength: verse.text.length, size: getCardSize(verse), textScale, columnWidth }) })),
    columnCount,
    columnWidth,
    gap: VERSE_MASONRY_GAP,
  }), [columnCount, columnWidth, layoutKey, measurements, textScale, verses]);
}
