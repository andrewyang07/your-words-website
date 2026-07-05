'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, Flame, HelpCircle, Keyboard, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useReviewStore } from '@/stores/useReviewStore';
import { buildDailyReviewQuota, createReviewProgress, type MemorizationItem, type ReviewRating } from '@/lib/review/dailyReview';
import { evaluateInitialRecall, getNextRecallHint } from '@/lib/review/initialRecall';
import { loadChapterVerses, loadPresetVerses } from '@/lib/dataLoader';
import type { Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

type Step = 'read' | 'recall' | 'check';

const ratingCopy: Record<ReviewRating, string> = {
  'got-it': '会了',
  fuzzy: '模糊',
  missed: '不会',
};

export default function ReviewPageClient() {
  const { language } = useAppStore();
  const { getFavoritesList } = useFavoritesStore();
  const { reviewGroups, progress, ensureProgress, rateItem, completeQuota, streak, getMasteryProgress } = useReviewStore();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>('read');
  const [input, setInput] = useState('');
  const [completed, setCompleted] = useState(false);
  const [includeNotDue, setIncludeNotDue] = useState(false);
  const [today, setToday] = useState(() => new Date());

  const favoriteKey = getFavoritesList().join('|');
  const favoriteIds = useMemo(() => (favoriteKey ? favoriteKey.split('|') : []), [favoriteKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviewPool() {
      setLoading(true);
      setError(null);

      try {
        const favoriteVerses = await loadFavoriteVerses(favoriteIds, language);
        const curatedVerses = favoriteVerses.length > 0 ? [] : await loadPresetVerses(language);
        if (!cancelled) setVerses(favoriteVerses.length > 0 ? favoriteVerses : curatedVerses);
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
        savedVerseIds: favoriteIds,
        reviewGroups,
        progress,
        verses,
        today,
        includeNotDue,
      }),
    [favoriteIds, reviewGroups, progress, verses, today, includeNotDue]
  );

  const currentItem = quota.items[index];
  const recallText = currentItem?.verses.map((verse) => verse.text).join('\n') ?? '';
  const recallResult = evaluateInitialRecall({ text: recallText, language: 'zh', input });
  const mastery = getMasteryProgress();

  useEffect(() => {
    if (!currentItem) return;
    ensureProgress(currentItem.id, today);
  }, [currentItem, ensureProgress, today]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && step === 'read') setStep('recall');
      if (event.key === 'Enter' && step === 'recall') setStep('check');
      if (step === 'check' && ['1', '2', '3'].includes(event.key)) {
        const rating = event.key === '1' ? 'got-it' : event.key === '2' ? 'fuzzy' : 'missed';
        handleRate(rating);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentItem, index, quota.items.length]);

  const handleHint = () => {
    const hint = getNextRecallHint({ text: recallText, language: 'zh', input });
    if (hint) setInput((value) => `${value}${hint}`);
  };

  const handleRate = (rating: ReviewRating) => {
    if (!currentItem) return;
    rateItem(currentItem.id, rating, new Date());

    if (index + 1 >= quota.items.length) {
      completeQuota(new Date());
      setCompleted(true);
      return;
    }

    setIndex((value) => value + 1);
    setStep('read');
    setInput('');
  };

  const handleContinue = () => {
    setIndex(0);
    setInput('');
    setStep('read');
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

            <ReviewText item={currentItem} step={step} recallDisplay={recallResult.displayText} />

            {step === 'read' && (
              <button onClick={() => setStep('recall')} className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-stone-950 px-4 text-white dark:bg-stone-50 dark:text-stone-950">
                <Keyboard className="h-4 w-4" />
                开始回想
              </button>
            )}

            {step === 'recall' && (
              <div className="mt-6 space-y-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  autoFocus
                  className="h-12 w-full rounded border border-stone-900/10 bg-white px-3 text-lg outline-none focus:ring-2 focus:ring-stone-800 dark:border-white/10 dark:bg-white/[0.06] dark:focus:ring-stone-200"
                  placeholder="输入每个汉字；标点空格可忽略"
                />
                {!recallResult.isValidPrefix && <p className="text-sm text-amber-700 dark:text-amber-300">慢慢来，刚才那一位可能不对。</p>}
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleHint} className="inline-flex min-h-[44px] items-center gap-2 rounded border border-stone-900/10 px-3 text-sm dark:border-white/10">
                    <HelpCircle className="h-4 w-4" />
                    提示
                  </button>
                  <button onClick={() => setStep('check')} className="inline-flex min-h-[44px] items-center gap-2 rounded bg-stone-950 px-4 text-sm text-white dark:bg-stone-50 dark:text-stone-950">
                    <Eye className="h-4 w-4" />
                    查看全文
                  </button>
                </div>
              </div>
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

function ReviewText({ item, step, recallDisplay }: { item: MemorizationItem; step: Step; recallDisplay: string }) {
  const text = step === 'check' ? item.verses.map((verse) => verse.text).join('\n') : step === 'recall' ? recallDisplay : item.verses.map((verse) => verse.text).join('\n');

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
          ['New', mastery.new],
          ['Learning', mastery.learning],
          ['Reviewing', mastery.reviewing],
          ['Mastered', mastery.mastered],
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
