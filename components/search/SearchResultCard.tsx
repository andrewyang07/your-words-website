'use client';

import { Copy, Check, Star, BookOpen, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { highlightText, type HighlightSegment } from '@/lib/search/highlighter';
import { getSearchEngine } from '@/lib/search/searchEngine';
import type { SearchResult } from '@/types/search';

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
}

function HighlightedText({ segments }: { segments: HighlightSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded-sm px-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

export default function SearchResultCard({
  result,
  index,
  isSelected,
}: SearchResultCardProps) {
  const [copied, setCopied] = useState(false);
  const { query, searchLang, setContextVerse, setSelectedIndex } =
    useSearchStore();
  const language = useAppStore((s) => s.language);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const favorited = isFavorite(result.id);

  // Determine book name based on app language setting
  const bookNameChinese =
    language === 'traditional' ? result.bookTraditional : result.bookKey;

  const showChinese = searchLang === 'zh';
  const showEnglish = searchLang === 'en';

  const handleCopy = async () => {
    let text = '';
    if (showChinese) {
      text = `${bookNameChinese} ${result.chapter}:${result.verse} ${result.textChinese}`;
    } else {
      text = `${result.bookEnglish} ${result.chapter}:${result.verse} ${result.textEnglish}`;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available
    }
  };

  const handleContext = () => {
    const engine = getSearchEngine();
    const verses = engine.getContext(
      result.bookKey,
      result.chapter,
      result.verse
    );
    setContextVerse({
      bookKey: result.bookKey,
      chapter: result.chapter,
      verse: result.verse,
      verses,
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/search?q=${encodeURIComponent(
      `${result.bookKey}${result.chapter}:${result.verse}`
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bookNameChinese} ${result.chapter}:${result.verse}`,
          text: result.textChinese,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  const zhSegments = highlightText(result.textChinese, query);
  const enSegments = highlightText(result.textEnglish, query);

  return (
    <div
      className={`group rounded-2xl border p-5 transition-all cursor-pointer ${
        isSelected
          ? 'border-bible-400 dark:border-bible-500 bg-bible-50/80 dark:bg-gray-800 shadow-sm'
          : 'border-bible-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-bible-300 dark:hover:border-gray-600'
      }`}
      onClick={() => setSelectedIndex(index)}
    >
      {/* Reference header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {showChinese && (
            <span className="text-sm font-semibold text-bible-700 dark:text-bible-300 font-chinese">
              {bookNameChinese} {result.chapter}:{result.verse}
            </span>
          )}
          {showEnglish && (
            <span className="text-sm font-medium text-bible-600 dark:text-bible-300">
              {result.bookEnglish} {result.chapter}:{result.verse}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(result.id);
            }}
            className="p-1.5 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors"
            title={favorited ? '取消收藏' : '收藏'}
          >
            <Star
              className={`w-4 h-4 ${
                favorited
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-bible-500 dark:text-bible-400'
              }`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1.5 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors"
            title="复制"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-bible-500 dark:text-bible-400" />
            )}
          </button>
        </div>
      </div>

      {/* Verse text */}
      <div className="space-y-1.5 mb-3">
        {showChinese && (
          <p className="text-bible-800 dark:text-bible-200 font-chinese leading-relaxed">
            <HighlightedText segments={zhSegments} />
          </p>
        )}
        {showEnglish && (
          <p className="text-bible-800 dark:text-bible-200 leading-relaxed">
            <HighlightedText segments={enSegments} />
          </p>
        )}
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContext();
          }}
          className="inline-flex items-center gap-1 text-bible-500 dark:text-bible-400 hover:text-bible-700 dark:hover:text-bible-300 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="font-chinese">上下文</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="inline-flex items-center gap-1 text-bible-500 dark:text-bible-400 hover:text-bible-700 dark:hover:text-bible-300 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="font-chinese">分享</span>
        </button>
      </div>
    </div>
  );
}
