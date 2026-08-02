'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { decodeVerseList, decodeVerseRef, encodeVerseRef } from '@/lib/bibleBookMapping';
import { loadCuvVersesById } from '@/lib/memorize/loadVerses';
import {
  buildMemorizationSession,
  pressInitial,
  revealCurrentUnit,
  skipRecallStage,
  type MemorizationSession,
} from '@/lib/memorize/session';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import type { Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const stages = [
  { name: '通读', instruction: '先读一遍，不急着记', initialsRequired: false },
  { name: '轻遮', instruction: '凭留下的字，补全句子', initialsRequired: false },
  { name: '深遮', instruction: '只留少量线索，再想一遍', initialsRequired: false },
  { name: '首字母', instruction: '按每个字的拼音首字母', initialsRequired: true },
] as const;
type MemorizationStage = 0 | 1 | 2 | 3;
const finalStage: MemorizationStage = 3;
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function MemorizePageClient() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const favoriteIds = useMemo(() => Array.from(favorites), [favorites]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selected, setSelected] = useState<Verse | null>(null);
  const [session, setSession] = useState<MemorizationSession | null>(null);
  const [stage, setStage] = useState<MemorizationStage>(0);
  const [loading, setLoading] = useState(true);
  const [loadingInitials, setLoadingInitials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const startVerse = useCallback((verse: Verse) => {
    const seed = `${verse.id}:${crypto.randomUUID?.() ?? Date.now()}`;
    setSelected(verse);
    setSession(buildMemorizationSession(verse.text, seed));
    setStage(0);
    setCompleted(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { ids, directId } = resolveMemorizeSourceIds(window.location.search, favoriteIds);
        const loaded = await loadCuvVersesById(ids);
        if (cancelled) return;
        const favoriteSet = new Set(favoriteIds);
        setVerses(loaded.filter((verse) => favoriteSet.has(verse.id)));
        const directVerse = directId ? loaded.find((verse) => verse.id === directId) : null;
        if (directVerse) startVerse(directVerse);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '经文加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [favoriteIds, startVerse]);

  const enterStage = useCallback(async (nextStage: number) => {
    if (!selected || !session) return;
    if (nextStage >= stages.length) {
      setCompleted(true);
      return;
    }
    const resolvedStage = nextStage as MemorizationStage;
    if (stages[resolvedStage].initialsRequired && session.units.some((unit) => unit.recallable && unit.acceptedInitials.length === 0)) {
      setLoadingInitials(true);
      try {
        const { buildContextualInitials } = await import('@/lib/memorize/contextualInitials');
        setSession(buildMemorizationSession(selected.text, session.seed, buildContextualInitials(session.body)));
      } catch {
        // Keep the all-masked stage available: reveal-current and skip remain escape hatches.
      } finally {
        setLoadingInitials(false);
      }
    }
    setStage(resolvedStage);
  }, [selected, session]);

  const submitInitial = useCallback((letter: string) => {
    if (stage !== finalStage) return;
    setSession((current) => {
      if (!current) return current;
      const recall = pressInitial(current.recall, current.units, letter);
      if (recall.lastAttempt === 'wrong') navigator.vibrate?.(35);
      if (recall.complete) setCompleted(true);
      return { ...current, recall };
    });
  }, [stage]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  if (!selected || !session) {
    return <VersePicker verses={verses} onSelect={startVerse} />;
  }

  if (completed) {
    return (
      <main className="memorize-page flex min-h-[100dvh] items-center justify-center px-5 py-8">
        <section className="w-full max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-900/15 bg-white/55 text-amber-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-amber-200"><Sparkles className="h-6 w-6" /></span>
          <p className="mt-6 text-xs tracking-[0.28em] text-stone-500">{reference(selected)}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.08em]">本轮结束</h1>
          <div className="mt-8 grid gap-3">
            <button onClick={() => startVerse(selected)} className="memorize-primary"><RotateCcw className="h-4 w-4" />重新背诵</button>
            <button onClick={() => { setSelected(null); setSession(null); setCompleted(false); }} className="memorize-secondary">选择另一节</button>
            <Link href="/" className="memorize-secondary">完成并返回</Link>
          </div>
        </section>
      </main>
    );
  }

  const skip = () => {
    if (stage === finalStage) setSession((current) => current ? { ...current, recall: skipRecallStage(current.recall) } : current);
    void enterStage(stage + 1);
  };

  return (
    <main className="memorize-page flex min-h-[100dvh] flex-col overflow-x-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <button onClick={() => { setSelected(null); setSession(null); }} className="memorize-icon" aria-label="返回经文列表"><ArrowLeft className="h-5 w-5" /></button>
        <StageIndicator stage={stage} />
        <button onClick={skip} className="min-h-11 px-2 text-sm text-stone-500 hover:text-stone-950 dark:hover:text-white">跳过</button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-5 sm:py-8">
        <div className="mb-5 text-center">
          <p className="text-xs tracking-[0.24em] text-stone-500">{reference(selected)}</p>
          <h1 className="mt-2 text-lg font-medium">{stageInstruction(stage)}</h1>
        </div>
        <VerseExercise session={session} stage={stage} />
        {session.notes.length > 0 && (
          <aside className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-stone-500" aria-label="经文注释">注：{session.notes.join('；')}</aside>
        )}

        {stage === finalStage ? (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setSession((current) => {
                  if (!current) return current;
                  const recall = revealCurrentUnit(current.recall, current.units);
                  if (recall.complete) setCompleted(true);
                  return { ...current, recall };
                })}
                className="memorize-secondary !w-auto px-4"
              ><Eye className="h-4 w-4" />显示这个字</button>
              <button onClick={skip} className="min-h-11 text-sm text-stone-500">跳过本轮</button>
            </div>
            <AlphabetKeyboard disabled={loadingInitials} onPress={submitInitial} />
          </div>
        ) : (
          <button onClick={() => void enterStage(stage + 1)} className="memorize-primary mx-auto mt-7 max-w-xs">继续<ChevronRight className="h-4 w-4" /></button>
        )}
      </section>
    </main>
  );
}

export function AlphabetKeyboard({ disabled = false, onPress }: { disabled?: boolean; onPress: (letter: string) => void }) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!disabled && /^[a-z]$/i.test(event.key)) onPress(event.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [disabled, onPress]);

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-7 gap-1 sm:grid-cols-9" aria-label="字母键盘">
      {alphabet.map((letter) => <button key={letter} disabled={disabled} onClick={() => onPress(letter)} className="min-h-11 rounded-lg border border-stone-900/10 bg-white/65 text-sm font-semibold shadow-sm active:scale-95 disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06]">{letter}</button>)}
    </div>
  );
}

export function VerseExercise({ session, stage }: { session: MemorizationSession; stage: MemorizationStage }) {
  let recallOrdinal = 0;
  return (
    <p className={`memorize-verse whitespace-pre-wrap ${session.recall.lastAttempt === 'wrong' ? 'memorize-wrong' : ''}`} aria-live="polite">
      {session.units.map((unit, index) => {
        if (!unit.recallable) return <span key={index}>{unit.text}</span>;
        const ordinal = recallOrdinal++;
        const hidden = stage === 1 ? session.masks.partial30.has(index)
          : stage === 2 ? session.masks.partial65.has(index)
            : stage === 3 ? ordinal >= session.recall.cursor : false;
        return <span key={index} className={hidden ? 'memorize-hidden' : 'memorize-revealed'}>{unit.text}</span>;
      })}
    </p>
  );
}

function VersePicker({ verses, onSelect }: { verses: Verse[]; onSelect: (verse: Verse) => void }) {
  return (
    <main className="memorize-page min-h-[100dvh] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between"><Link href="/" className="memorize-icon" aria-label="返回首页"><ArrowLeft className="h-5 w-5" /></Link><span className="text-xs tracking-[0.24em] text-stone-500">CUV</span></header>
        <section className="py-8 sm:py-12">
          <p className="text-xs tracking-[0.28em] text-amber-800/70 dark:text-amber-200/70">深度背诵</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.05em] sm:text-4xl">选择一节，慢慢记住</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">每次只背一节。四个阶段都可以跳过。</p>
        </section>
        {verses.length === 0 ? (
          <div className="rounded-3xl border border-stone-900/10 bg-white/45 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <BookOpen className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-4 text-lg">先收藏一节想背的经文</p>
            <Link href="/" className="memorize-primary mx-auto mt-6 max-w-xs">浏览经文</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {verses.map((verse) => <button key={verse.id} onClick={() => onSelect(verse)} className="group rounded-2xl border border-stone-900/10 bg-white/55 p-5 text-left transition hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"><span className="text-xs tracking-[0.18em] text-stone-500">{reference(verse)}</span><span className="mt-3 block line-clamp-4 text-lg leading-8">{verse.text}</span></button>)}
          </div>
        )}
      </div>
    </main>
  );
}

function StageIndicator({ stage }: { stage: MemorizationStage }) {
  return <div className="flex items-center gap-1.5" aria-label={`第 ${stage + 1} 阶段，共 4 阶段`}>{stages.map(({ name }, index) => <span key={name} className={`h-1.5 rounded-full transition-all ${index === stage ? 'w-8 bg-amber-800 dark:bg-amber-200' : index < stage ? 'w-4 bg-amber-800/35 dark:bg-amber-200/35' : 'w-4 bg-stone-900/10 dark:bg-white/10'}`} title={name} />)}</div>;
}

function stageInstruction(stage: MemorizationStage) {
  return stages[stage].instruction;
}

function reference(verse: Verse) { return `${verse.book} ${verse.chapter}:${verse.verse}`; }

export function memorizeHref(verse: Verse) {
  return `/memorize?v=${encodeURIComponent(encodeVerseRef(verse.bookKey, verse.chapter, verse.verse))}`;
}

export function resolveMemorizeSourceIds(search: string, favoriteIds: string[]) {
  const params = new URLSearchParams(search);
  const encodedDirect = params.get('v');
  const encodedShared = params.get('s');
  const directRef = (encodedDirect ? decodeVerseRef(encodedDirect) : null)
    ?? (encodedShared ? decodeVerseList(encodedShared)[0] : null);
  const directId = directRef ? `${directRef.bookKey}-${directRef.chapter}-${directRef.verse}` : null;
  return { ids: [...new Set(directId ? [directId, ...favoriteIds] : favoriteIds)], directId };
}
