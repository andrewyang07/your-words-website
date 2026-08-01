'use client';

import { useMemo, useRef } from 'react';
import type { OrderedMasonryPosition } from '@/lib/orderedMasonry';
import { useReaderPreferencesStore } from '@/stores/useReaderPreferencesStore';
import type { Verse } from '@/types/verse';
import { getCardSize } from '@/lib/utils';
import VerseCard from './VerseCard';
import { useMeasuredMasonry } from './useMeasuredMasonry';

interface MasonryLayoutProps {
  verses: Verse[];
  onViewInBible?: (verse: Verse) => void;
  defaultRevealed?: boolean;
}

interface PositionedVerseCardProps extends Omit<MasonryLayoutProps, 'verses'> {
  verse: Verse;
  position?: OrderedMasonryPosition;
}

function PositionedVerseCard({ verse, position, onViewInBible, defaultRevealed }: PositionedVerseCardProps) {
  return (
    <div data-masonry-id={verse.id} className="absolute left-0 top-0 motion-safe:transition-transform motion-safe:duration-200"
      style={{ width: position?.width ?? 0, transform: `translate3d(${position?.x ?? 0}px, ${position?.y ?? 0}px, 0)` }}>
      <div className="animate-fade-in">
        <VerseCard verse={verse} size={getCardSize(verse)} onViewInBible={() => onViewInBible?.(verse)}
          defaultRevealed={defaultRevealed} />
      </div>
    </div>
  );
}

export default function MasonryLayout({ verses, onViewInBible, defaultRevealed = false }: MasonryLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textSize = useReaderPreferencesStore((state) => state.textSize);
  const layout = useMeasuredMasonry(containerRef, verses, textSize);
  const positions = useMemo(() => new Map(layout.positions.map((position) => [position.id, position])), [layout.positions]);

  return (
    <div ref={containerRef} className="p-4 sm:p-6">
      <div className="relative motion-safe:transition-[height] motion-safe:duration-200"
        style={{ height: layout.containerHeight, visibility: layout.positions[0]?.width ? 'visible' : 'hidden' }}>
        {verses.map((verse) => <PositionedVerseCard key={verse.id} verse={verse} position={positions.get(verse.id)}
          onViewInBible={onViewInBible} defaultRevealed={defaultRevealed} />)}
      </div>
    </div>
  );
}
