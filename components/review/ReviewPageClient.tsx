'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, Flame, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useReviewStore } from '@/stores/useReviewStore';
import { buildDailyReviewQuota, type MemorizationItem, type ReviewRating } from '@/lib/review/dailyReview';
import { loadChapterVerses, loadPresetVerses } from '@/lib/dataLoader';
import { useMaskStore } from '@/stores/useMaskStore';
import { maskVerseText } from '@/lib/utils';
import { decodeVerseList } from '@/lib/bibleBookMapping';
import type { Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

type Step = 'masked' | 'check';

const ratingCopy: Record<ReviewRating, string> = {
  'got-it': '会了',
  fuzzy: '模糊',
  missed: '不会',
};

export default function ReviewPageClient() {
  const { language } = useAppStore();
  const { getFavoritesList } = useFavoritesStore();
  const { reviewGroups, progress, ensureProgress, rateItem, completeQuota, streak, getMasteryProgress } = useReviewStore();
  const { maskMode, maskCharsType, maskCharsFixed, maskCharsMin, maskCharsMax } = useMaskStore();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>('masked');
  const [completed, setCompleted] = useState(false);
  const [includeNotDue, setIncludeNotDue] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const visibleChars = maskCharsType === 'fixed' ? maskCharsFixed : Math.max(maskCharsMin, Math.min(maskCharsMax, 2));

  const favoriteKey = getFavoritesList().join('|');
  const favoriteIds = useMemo(() => (favoriteKey ? favoriteKey.split('|') : []), [favoriteKey]);
  const reviewPoolIds = sharedIds.length > 0 ? sharedIds : favoriteIds;

  useEffect(() => {
    let cancelled = false;

    async function loadReviewPool() {
      setLoading(true);
      setError(null);

      try {
        const ids = getSharedReviewIds();
        if (!cancelled) setSharedIds(ids);
        const poolIds = ids.length > 0 ? ids : favoriteIds;
        const poolVerses = await loadFavoriteVerses(poolIds, language);
        const curatedVerses = poolVerses.length > 0 ? [] : await loadPresetVerses(language);
        if (!cancelled) setVerses(poolVerses.length > 0 ? poolVerses : curatedVerses);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载每日复习失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReviewPool();
    return () => {
      cancelled = true;
    };
  }, [favoriteIds, language]);

  const quota = useMemo(
    () =>
      buildDailyReviewQuota({
        savedVerseIds: reviewPoolIds,
        reviewGroups,
        progress,
        verses,
        today,
        includeNotDue,
      }),
    [reviewPoolIds, reviewGroups, progress, verses, today, includeNotDue]
  );

  const currentItem = quota.items[index];
  const mastery = getMasteryProgress();

  useEffect(() => {
    if (!currentItem) return;
    ensureProgress(currentItem.id, today);
  }, [currentItem, ensureProgress, today]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && step === 'masked') setStep('check');
      if (step === 'check' && ['1', '2', '3'].includes(event.key)) {
        const rating = event.key === '1' ? 'got-it' : event.key === '2' ? 'fuzzy' : 'missed';
        handleRate(rating);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentItem, index, quota.items.length]);

  const handleRate = (rating: ReviewRating) => {
    if (!currentItem) return;
    rateItem(currentItem.id, rating, new Date());

    if (index + 1 >= quota.items.length) {
      completeQuota(new Date());
      setCompleted(true);
      return;
    }

    setIndex((value) => value + 1);
    setStep('masked');
  };

  const handleContinue = () => {
    setIndex(0);
    setStep('masked');
    setCompleted(false);
    setIncludeNotDue(true);
    setToday(new Date());
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <main className="min-h-screen bg-[#f8f5ee] text-stone-950 dark:bg-[#0e1116] dark:text-stone-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-5 sm:py-8">
        <header className="mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded border border-stone-900/10 bg-white/65 px-3 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-stone-200">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <Flame className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            <span>{streak.count} 天</span>
          </div>
        </header>

        {completed ? (
          <CompletionPanel mastery={mastery} onContinue={handleContinue} />
        ) : currentItem ? (
          <section className="flex flex-1 flex-col rounded-lg border border-stone-900/10 bg-white/76 p-5 shadow-[0_24px_70px_rgba(68,64,60,0.10)] dark:border-white/10 dark:bg-white/[0.045] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">每日复习</p>
                <h1 className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{currentItem.title}</h1>
              </div>
              <span className="rounded border border-stone-900/10 px-2.5 py-1 text-xs text-stone-600 dark:border-white/10 dark:text-stone-300">
                {index + 1}/{quota.items.length}
              </span>
            </div>

            <ReviewText item={currentItem} step={step} maskMode={maskMode} visibleChars={visibleChars} />

            {step === 'masked' && (
              <button onClick={() => setStep('check')} className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-stone-950 px-4 text-white dark:bg-stone-50 dark:text-stone-950">
                <Eye className="h-4 w-4" />
                查看全文
              </button>
            )}

            {step === 'check' && (
              <div className="mt-6 grid grid-cols-3 gap-2">
                {(['got-it', 'fuzzy', 'missed'] as ReviewRating[]).map((rating, ratingIndex) => (
                  <button key={rating} onClick={() => handleRate(rating)} className="min-h-[48px] rounded border border-stone-900/10 bg-white/70 px-2 text-sm font-medium dark:border-white/10 dark:bg-white/[0.05]">
                    {ratingCopy[rating]}
                    <span className="ml-1 text-xs text-stone-400">{ratingIndex + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <EmptyReview onContinue={handleContinue} />
        )}
      </div>
    </main>
  );
}

function ReviewText({
  item,
  step,
  maskMode,
  visibleChars,
}: {
  item: MemorizationItem;
  step: Step;
  maskMode: 'punctuation' | 'prefix';
  visibleChars: number;
}) {
  const fullText = item.verses.map((verse) => verse.text).join('\n');
  const text = step === 'check' ? fullText : maskVerseText(fullText, maskMode, visibleChars);

  return (
    <div className="min-h-[280px] flex-1 rounded border border-stone-900/10 bg-stone-50/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
      <p className="whitespace-pre-wrap break-words text-[20px] leading-[2.1] text-stone-900 dark:text-stone-100">{text}</p>
    </div>
  );
}

function CompletionPanel({ mastery, onContinue }: { mastery: Record<string, number>; onContinue: () => void }) {
  return (
    <section className="rounded-lg border border-stone-900/10 bg-white/76 p-6 shadow-[0_24px_70px_rgba(68,64,60,0.10)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded bg-emerald-600 text-white">
        <Check className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold">今日完成</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">配额已完成，明天继续。掌握进度已更新。</p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['新内容', mastery.new],
          ['练习中', mastery.learning],
          ['复习中', mastery.reviewing],
          ['熟悉了', mastery.mastered],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-stone-900/10 p-3 dark:border-white/10">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <button onClick={onContinue} className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded bg-stone-950 px-4 text-white dark:bg-stone-50 dark:text-stone-950">
        <RotateCcw className="h-4 w-4" />
        继续复习
      </button>
    </section>
  );
}

function EmptyReview({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="rounded-lg border border-stone-900/10 bg-white/76 p-6 dark:border-white/10 dark:bg-white/[0.045]">
      <h1 className="text-2xl font-semibold">今天没有到期内容</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">可以继续复习，或先去收藏更多经文。</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={onContinue} className="min-h-[44px] rounded bg-stone-950 px-4 text-white dark:bg-stone-50 dark:text-stone-950">继续复习</button>
        <Link href="/" className="inline-flex min-h-[44px] items-center rounded border border-stone-900/10 px-4 dark:border-white/10">去收藏</Link>
      </div>
    </section>
  );
}

async function loadFavoriteVerses(favoriteIds: string[], language: 'simplified' | 'traditional'): Promise<Verse[]> {
  const chapterGroups = new Map<string, Set<number>>();

  favoriteIds.forEach((id) => {
    const parts = id.split('-');
    if (parts.length < 3) return;
    const verseNumber = Number(parts[parts.length - 1]);
    const chapter = Number(parts[parts.length - 2]);
    const bookKey = parts.slice(0, -2).join('-');
    const key = `${bookKey}-${chapter}`;
    if (!chapterGroups.has(key)) chapterGroups.set(key, new Set());
    chapterGroups.get(key)?.add(verseNumber);
  });

  const loaded: Verse[] = [];
  for (const [key, verseNumbers] of chapterGroups) {
    const parts = key.split('-');
    const chapter = Number(parts.pop());
    const bookKey = parts.join('-');
    const chapterVerses = await loadChapterVerses(bookKey, chapter, language);
    loaded.push(...chapterVerses.filter((verse) => verseNumbers.has(verse.verse)));
  }

  return loaded;
}

function getSharedReviewIds(): string[] {
  if (typeof window === 'undefined') return [];
  const encoded = new URLSearchParams(window.location.search).get('s');
  if (!encoded) return [];
  return decodeVerseList(encoded).map(({ bookKey, chapter, verse }) => `${bookKey}-${chapter}-${verse}`);
}
