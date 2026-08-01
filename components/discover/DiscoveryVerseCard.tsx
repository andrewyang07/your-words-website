'use client';

import { Check, Star } from 'lucide-react';
import type { Verse } from '@/types/verse';
import { getVerseReference } from './discoveryHelpers';
import { getReaderTextStyle } from '@/lib/readerPreferences';
import { useReaderPreferencesStore } from '@/stores/useReaderPreferencesStore';

interface DiscoveryVerseCardProps {
  verse: Verse;
  saved: boolean;
  onSave: (verse: Verse) => void;
}

export default function DiscoveryVerseCard({ verse, saved, onSave }: DiscoveryVerseCardProps) {
  const textSize = useReaderPreferencesStore((state) => state.textSize);

  return (
    <article className="rounded-lg border border-stone-900/10 bg-white/78 p-4 shadow-[0_18px_50px_rgba(68,64,60,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p
            className="reader-text font-medium text-stone-950 dark:text-stone-100"
            style={getReaderTextStyle(textSize, '14px') as React.CSSProperties}
          >
            {getVerseReference(verse)}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{verse.testament === 'new' ? '新约' : '旧约'}</p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-700/20 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
            <Check className="h-3.5 w-3.5" />
            已存
          </span>
        )}
      </div>

      <p
        className="reader-text min-h-[84px] whitespace-pre-wrap break-words leading-[1.88] text-stone-900 dark:text-stone-100"
        style={getReaderTextStyle(textSize, '17px') as React.CSSProperties}
      >
        {verse.text}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSave(verse)}
          className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded bg-stone-950 px-3 text-sm text-white disabled:cursor-default disabled:bg-stone-300 disabled:text-stone-600 dark:bg-stone-50 dark:text-stone-950 dark:disabled:bg-white/15 dark:disabled:text-stone-400"
          disabled={saved}
        >
          <Star className="h-4 w-4" />
          {saved ? '已加入复习' : '加入复习'}
        </button>
      </div>
    </article>
  );
}
