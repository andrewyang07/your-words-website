'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, ChevronRight, Eye, RotateCcw } from 'lucide-react';
import { decodeVerseList, decodeVerseRef, encodeVerseRef } from '@/lib/bibleBookMapping';
import { loadCuvVersesById } from '@/lib/memorize/loadVerses';
import {
  buildMemorizationSession,
  completionFactsForRound,
  completionFactsForStage,
  currentAcceptedInitials,
  currentAcceptedZhuyin,
  groupedInitialsInput,
  orderedMaskIndices,
  pressInitial,
  pressMaskedInitial,
  revealMaskedCurrentUnit,
  revealCurrentUnit,
  singleInitialInput,
  singleZhuyinInput,
  skipMemorizationStage,
  withAcceptedPhonetics,
  type MemorizationSession,
  type RecallKeyboardInput,
} from '@/lib/memorize/session';
import { CompletionReward } from '@/components/memorize/CompletionReward';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import type { Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { MemorizeHelpButton, useMemorizeGuide } from '@/components/memorize/MemorizeGuide';
import { useAppStore } from '@/stores/useAppStore';
import booksData from '@/public/data/books.json';
import type { Language } from '@/types/verse';
import { DA_CHEN_ZHUYIN_ROWS, zhuyinForPhysicalKey } from '@/lib/memorize/zhuyinKeyboard';

const copy = {
  simplified: {
    stages: [
      { name: '通读', instruction: '先读一遍，不急着记' },
      { name: '轻遮', instruction: '凭留下的字，补全句子' },
      { name: '深遮', instruction: '只留少量线索，再想一遍' },
      { name: '首字母', instruction: '按每个字的拼音首字母' },
    ],
    loadingError: '经文加载失败', backToPicker: '返回经文列表', skip: '跳过', note: '经文注释', notePrefix: '注：',
    reveal: '显示这个字', skipRound: '跳过本轮', previous: '返回上一步', continue: '继续',
    keyboard: '拼音首字母键盘', keyboardLayout: '键盘布局', t9: '九宫格', t9Keyboard: '九宫格键盘', qwertyKeyboard: 'QWERTY键盘', zhuyin: '注音', zhuyinKeyboard: '注音键盘', showPhysicalKeys: '显示实体键位', hidePhysicalKeys: '隐藏实体键位', hintedKey: '提示按键', retryInput: '再试一次', hintPrefix: '提示：请按', or: '或', keySuffix: '键',
    zhuyinInstruction: '按每个字读音的第一个注音符号',
    stageProgress: (stage: number) => `第 ${stage} 阶段，共 4 阶段`,
    finished: '本轮结束', retry: '重新背诵', chooseAnother: '选择另一节', finishAndReturn: '完成并返回',
    backHome: '返回首页', title: '深度背诵', pickerHeading: '选择一节，慢慢记住',
    pickerDescription: '每次只背一节。四个阶段都可以跳过。', empty: '先收藏一节想背的经文', browse: '浏览经文',
  },
  traditional: {
    stages: [
      { name: '通讀', instruction: '先讀一遍，不急著記' },
      { name: '輕遮', instruction: '憑留下的字，補全句子' },
      { name: '深遮', instruction: '只留少量線索，再想一遍' },
      { name: '首字母', instruction: '按每個字的拼音首字母' },
    ],
    loadingError: '經文載入失敗', backToPicker: '返回經文列表', skip: '跳過', note: '經文註釋', notePrefix: '註：',
    reveal: '顯示這個字', skipRound: '跳過本輪', previous: '返回上一步', continue: '繼續',
    keyboard: '拼音首字母鍵盤', keyboardLayout: '鍵盤佈局', t9: '九宮格', t9Keyboard: '九宮格鍵盤', qwertyKeyboard: 'QWERTY 鍵盤', zhuyin: '注音', zhuyinKeyboard: '注音鍵盤', showPhysicalKeys: '顯示實體鍵位', hidePhysicalKeys: '隱藏實體鍵位', hintedKey: '提示按鍵', retryInput: '再試一次', hintPrefix: '提示：請按', or: '或', keySuffix: '鍵',
    zhuyinInstruction: '按每個字讀音的第一個注音符號',
    stageProgress: (stage: number) => `第 ${stage} 階段，共 4 階段`,
    finished: '本輪結束', retry: '重新背誦', chooseAnother: '選擇另一節', finishAndReturn: '完成並返回',
    backHome: '返回首頁', title: '深度背誦', pickerHeading: '選擇一節，慢慢記住',
    pickerDescription: '每次只背一節。四個階段都可以跳過。', empty: '先收藏一節想背的經文', browse: '瀏覽經文',
  },
} as const;

const stageNeedsInitials = [false, true, true, true] as const;
type MemorizationStage = 0 | 1 | 2 | 3;
const finalStage: MemorizationStage = 3;
export type KeyboardLayout = 't9' | 'qwerty' | 'zhuyin';
export const MEMORIZE_KEYBOARD_LAYOUT_STORAGE_KEY = 'your-words:memorize-keyboard-layout:v1';
const t9Keys = [
  { number: '1', letters: '' },
  { number: '2', letters: 'ABC' },
  { number: '3', letters: 'DEF' },
  { number: '4', letters: 'GHI' },
  { number: '5', letters: 'JKL' },
  { number: '6', letters: 'MNO' },
  { number: '7', letters: 'PQRS' },
  { number: '8', letters: 'TUV' },
  { number: '9', letters: 'WXYZ' },
] as const;
const qwertyRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as const;

export default function MemorizePageClient() {
  const language = useAppStore((state) => state.language);
  const theme = useAppStore((state) => state.theme);
  const favorites = useFavoritesStore((state) => state.favorites);
  const favoriteIds = useMemo(() => Array.from(favorites), [favorites]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [versesLanguage, setVersesLanguage] = useState<Language | null>(null);
  const [selected, setSelected] = useState<Verse | null>(null);
  const [session, setSession] = useState<MemorizationSession | null>(null);
  const [stage, setStage] = useState<MemorizationStage>(0);
  const [loading, setLoading] = useState(true);
  const [loadingInitials, setLoadingInitials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [sessionLanguage, setSessionLanguage] = useState<Language | null>(null);
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>('t9');
  const sessionActive = useRef(false);
  const sessionRef = useRef<MemorizationSession | null>(null);
  const taiwanReadingsSeed = useRef<string | null>(null);
  const loadingTaiwanReadingsSeed = useRef<string | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const globalNavigation = document.querySelector<HTMLElement>('nav[aria-label="主要頁面"]');
    if (!globalNavigation) return;
    const wasInert = Boolean(globalNavigation.inert);
    globalNavigation.inert = true;
    return () => { globalNavigation.inert = wasInert; };
  }, []);

  const startVerse = useCallback((verse: Verse, languageSnapshot: Language = language) => {
    const seed = `${verse.id}:${crypto.randomUUID?.() ?? Date.now()}`;
    sessionActive.current = true;
    setSelected(verse);
    setSession(buildMemorizationSession(verse.text, seed));
    setSessionLanguage(languageSnapshot);
    setStage(0);
    setCompleted(false);
  }, [language]);

  useEffect(() => {
    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    const updateTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && Boolean(mediaQuery?.matches));
      document.documentElement.classList.toggle('dark', isDark);
    };
    updateTheme();
    if (theme !== 'system' || !mediaQuery) return;
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { ids, directId } = resolveMemorizeSourceIds(window.location.search, favoriteIds);
        const requestLanguage = language;
        const loaded = await loadCuvVersesById(ids, requestLanguage);
        if (cancelled) return;
        const favoriteSet = new Set(favoriteIds);
        setVerses(loaded.filter((verse) => favoriteSet.has(verse.id)));
        setVersesLanguage(requestLanguage);
        const directVerse = directId ? loaded.find((verse) => verse.id === directId) : null;
        if (directVerse && !sessionActive.current) startVerse(directVerse, requestLanguage);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : copy[language].loadingError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [favoriteIds, language, startVerse]);

  const restartVerse = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const [latestVerse] = await loadCuvVersesById([selected.id], language);
      if (!latestVerse) throw new Error(copy[language].loadingError);
      startVerse(latestVerse, language);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy[language].loadingError);
    } finally {
      setLoading(false);
    }
  }, [language, selected, startVerse]);

  const enterStage = useCallback(async (nextStage: number) => {
    if (!selected || !session) return;
    if (nextStage >= stageNeedsInitials.length) {
      setCompleted(true);
      return;
    }
    const resolvedStage = nextStage as MemorizationStage;
    if (stageNeedsInitials[resolvedStage] && session.units.some((unit) => unit.recallable && unit.acceptedInitials.length === 0)) {
      setLoadingInitials(true);
      try {
        const { buildContextualPhonetics } = await import('@/lib/memorize/contextualInitials');
        const acceptedPhonetics = buildContextualPhonetics(session.body);
        setSession((current) => current ? withAcceptedPhonetics(current, acceptedPhonetics) : current);
      } catch {
        // Keep the all-masked stage available: reveal-current and skip remain escape hatches.
      } finally {
        setLoadingInitials(false);
      }
    }
    setStage(resolvedStage);
  }, [selected, session]);

  const submitKeyboardInput = useCallback((input: RecallKeyboardInput) => {
    if (stage === 0) return;
    setSession((current) => {
      if (!current) return current;
      if (stage === 1 || stage === 2) {
        const key = stage === 1 ? 'partial30' : 'partial65';
        const recall = pressMaskedInitial(current.maskRecall[key], current.units, current.masks[key], input);
        return { ...current, maskRecall: { ...current.maskRecall, [key]: recall } };
      }
      const recall = pressInitial(current.recall, current.units, input);
      return { ...current, recall };
    });
  }, [stage]);

  const handleKeyboardLayoutChange = useCallback((layout: KeyboardLayout) => {
    setKeyboardLayout(layout);
    const target = sessionRef.current;
    if (layout !== 'zhuyin' || !target) return;
    if (taiwanReadingsSeed.current === target.seed || loadingTaiwanReadingsSeed.current === target.seed) return;

    loadingTaiwanReadingsSeed.current = target.seed;
    setLoadingInitials(true);
    void import('@/lib/memorize/taiwanZhuyin')
      .then(({ buildTaiwanContextualPhonetics }) => {
        const acceptedPhonetics = buildTaiwanContextualPhonetics(target.body);
        setSession((current) => current?.seed === target.seed
          ? withAcceptedPhonetics(current, acceptedPhonetics)
          : current);
        taiwanReadingsSeed.current = target.seed;
      })
      .catch(() => {
        // Retain the pinyin-derived Zhuyin readings if the optional model cannot load.
      })
      .finally(() => {
        if (loadingTaiwanReadingsSeed.current === target.seed) {
          loadingTaiwanReadingsSeed.current = null;
          setLoadingInitials(false);
        }
      });
  }, []);

  const activeLanguage = sessionLanguage ?? language;
  const activeCopy = copy[activeLanguage];
  const guideSurface = !selected ? 'picker' : completed ? 'complete' : stage > 0 ? 'input' : 'reading';
  const guide = useMemorizeGuide(guideSurface, activeLanguage);

  if (loading) return <LoadingSpinner language={language} />;
  if (error) return <ErrorMessage language={language} message={error} onRetry={() => window.location.reload()} />;

  if (!selected || !session) {
    if (versesLanguage !== language) return <LoadingSpinner language={language} />;
    return <VersePicker verses={verses} language={language} onSelect={(verse) => startVerse(verse, language)} guide={guide} />;
  }

  if (completed) {
    const completionFacts = completionFactsForRound(session);
    return (
      <main className="memorize-page flex min-h-[100dvh] flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <header className="mx-auto flex w-full max-w-3xl justify-end">
          <MemorizeHelpButton label={guide.helpLabel} onClick={guide.openGuide} />
        </header>
        <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center text-center">
          <p className="text-xs tracking-[0.28em] text-stone-500">{reference(selected, activeLanguage)}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.08em]">{activeCopy.finished}</h1>
          <div className="mt-6">
            <CompletionReward
              kind="round"
              language={activeLanguage}
              assistanceCount={completionFacts.assistanceCount}
              skippedStageCount={completionFacts.skippedStageCount}
            />
          </div>
          <div className="mt-8 grid gap-3">
            <button onClick={() => void restartVerse()} className="memorize-primary"><RotateCcw className="h-4 w-4" />{activeCopy.retry}</button>
            <button onClick={() => { sessionActive.current = false; setSelected(null); setSession(null); setSessionLanguage(null); setCompleted(false); }} className="memorize-secondary">{activeCopy.chooseAnother}</button>
            <Link href="/" className="memorize-secondary">{activeCopy.finishAndReturn}</Link>
          </div>
        </section>
        {guide.dialog}
      </main>
    );
  }

  const skip = () => {
    setSession((current) => current ? skipMemorizationStage(current, stage) : current);
  };

  const reveal = () => {
    if (stage === 0) return;
    setSession((current) => {
      if (!current) return current;
      if (stage === 1 || stage === 2) {
        const key = stage === 1 ? 'partial30' : 'partial65';
        const recall = revealMaskedCurrentUnit(current.maskRecall[key], current.units, current.masks[key]);
        return { ...current, maskRecall: { ...current.maskRecall, [key]: recall } };
      }
      const recall = revealCurrentUnit(current.recall, current.units);
      return { ...current, recall };
    });
  };

  const exitVerse = () => {
    sessionActive.current = false;
    setSelected(null);
    setSession(null);
    setSessionLanguage(null);
  };

  const goToPreviousStage = () => {
    if (stage === 0) return;
    setStage((stage - 1) as MemorizationStage);
  };

  const activeRecall = stage === 1 ? session.maskRecall.partial30
    : stage === 2 ? session.maskRecall.partial65
      : session.recall;
  const activeMask = stage === 1 ? session.masks.partial30
    : stage === 2 ? session.masks.partial65
      : undefined;
  const hintedInitials = activeRecall.hintVisible
    ? keyboardLayout === 'zhuyin'
      ? currentAcceptedZhuyin(activeRecall, session.units, activeMask)
      : currentAcceptedInitials(activeRecall, session.units, activeMask)
    : [];
  const stageCompletionFacts = completionFactsForStage(session, stage);

  return (
    <main className="memorize-page flex min-h-[100dvh] flex-col overflow-x-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <header className="mx-auto grid w-full max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-2">
        <button type="button" onClick={exitVerse} className="memorize-icon" aria-label={activeCopy.backToPicker}><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex justify-center"><StageIndicator stage={stage} language={activeLanguage} /></div>
        <div className="flex items-center justify-end gap-1">
          <MemorizeHelpButton label={guide.helpLabel} onClick={guide.openGuide} />
          {stageCompletionFacts.outcome === 'incomplete' && (
            <button onClick={skip} className="min-h-11 rounded-xl px-2 text-sm text-stone-500 hover:bg-white/55 hover:text-stone-950 dark:hover:bg-white/[0.06] dark:hover:text-white">{activeCopy.skip}</button>
          )}
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-5 sm:py-8">
        <div className="mb-5 text-center">
          <p className="text-xs tracking-[0.24em] text-stone-500">{reference(selected, activeLanguage)}</p>
          <h1 className="mt-2 text-lg font-medium">{stageInstruction(stage, activeLanguage, keyboardLayout)}</h1>
        </div>
        <VerseExercise session={session} stage={stage} />
        {session.notes.length > 0 && (
          <aside className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-stone-500" aria-label={activeCopy.note}>{activeCopy.notePrefix}{session.notes.join('；')}</aside>
        )}
        {stageCompletionFacts.outcome !== 'incomplete' && (
          <div className="mt-5">
            <CompletionReward
              kind="stage"
              language={activeLanguage}
              assistanceCount={stageCompletionFacts.assistanceCount}
              skippedStageCount={stageCompletionFacts.outcome === 'skipped' ? 1 : 0}
            />
          </div>
        )}

        {stage > 0 ? (
          <div className="mt-5">
            <RecallFeedback language={activeLanguage} recall={activeRecall} hintedInitials={hintedInitials} />
            <div className="mb-3 flex items-center justify-between gap-3">
              <button onClick={reveal} className="memorize-secondary !w-auto px-4"><Eye className="h-4 w-4" />{activeCopy.reveal}</button>
              {stage === finalStage && stageCompletionFacts.outcome === 'incomplete' && (
                <button onClick={skip} className="min-h-11 text-sm text-stone-500">{activeCopy.skipRound}</button>
              )}
            </div>
            <AlphabetKeyboard
              language={activeLanguage}
              disabled={loadingInitials}
              hintedInitials={hintedInitials}
              wrongInitials={activeRecall.lastAttempt === 'wrong' ? activeRecall.lastAttemptedInputs : []}
              wrongAttempt={activeRecall.wrongAttempts}
              onPress={submitKeyboardInput}
              onLayoutChange={handleKeyboardLayoutChange}
              onZhuyinSelected={guide.showZhuyinCoach}
            />
            <button type="button" onClick={goToPreviousStage} className="memorize-secondary mx-auto mt-3 max-w-xs"><ArrowLeft className="h-4 w-4" />{activeCopy.previous}</button>
            {stageCompletionFacts.outcome !== 'incomplete' && (
              <button onClick={() => void enterStage(stage + 1)} className="memorize-primary mx-auto mt-3 max-w-xs">{activeCopy.continue}<ChevronRight className="h-4 w-4" /></button>
            )}
          </div>
        ) : (
          <button onClick={() => void enterStage(stage + 1)} className="memorize-primary mx-auto mt-7 max-w-xs">{activeCopy.continue}<ChevronRight className="h-4 w-4" /></button>
        )}
      </section>
      {guide.dialog}
    </main>
  );
}

export function AlphabetKeyboard({
  language = 'simplified',
  disabled = false,
  hintedInitials = [],
  wrongInitials = [],
  wrongAttempt = 0,
  onPress,
  onLayoutChange,
  onZhuyinSelected,
}: {
  language?: Language;
  disabled?: boolean;
  hintedInitials?: readonly string[];
  wrongInitials?: readonly string[];
  wrongAttempt?: number;
  onPress: (input: RecallKeyboardInput) => void;
  onLayoutChange?: (layout: KeyboardLayout) => void;
  onZhuyinSelected?: () => void;
}) {
  const [layout, setLayout] = useState<KeyboardLayout>('t9');
  const [showPhysicalKeys, setShowPhysicalKeys] = useState(true);
  const keyboardCopy = copy[language];

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(MEMORIZE_KEYBOARD_LAYOUT_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
    if (stored === 't9' || stored === 'qwerty' || stored === 'zhuyin') {
      setLayout(stored);
      onLayoutChange?.(stored);
    }
  }, [onLayoutChange]);

  const selectLayout = (nextLayout: KeyboardLayout) => {
    setLayout(nextLayout);
    onLayoutChange?.(nextLayout);
    try {
      window.localStorage.setItem(MEMORIZE_KEYBOARD_LAYOUT_STORAGE_KEY, nextLayout);
    } catch {
      // Keep the keyboard usable without persistence.
    }
    if (nextLayout === 'zhuyin' && layout !== 'zhuyin') onZhuyinSelected?.();
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (disabled) return;
      if (layout === 'zhuyin') {
        const symbol = zhuyinForPhysicalKey(event.key);
        if (symbol) onPress(singleZhuyinInput(symbol));
        return;
      }
      if (/^[a-z]$/i.test(event.key)) onPress(singleInitialInput(event.key));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [disabled, layout, onPress]);

  return (
    <div className="mx-auto w-full max-w-2xl" role="group" aria-label={layout === 'zhuyin' ? keyboardCopy.zhuyinKeyboard : keyboardCopy.keyboard}>
      <div className="mb-3 flex justify-center" role="group" aria-label={keyboardCopy.keyboardLayout}>
        <div className="inline-flex rounded-full border border-stone-900/10 bg-white/45 p-1 dark:border-white/10 dark:bg-white/[0.04]">
          {([['t9', keyboardCopy.t9], ['qwerty', 'QWERTY'], ['zhuyin', keyboardCopy.zhuyin]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={layout === value}
              onClick={() => selectLayout(value)}
              className={`min-h-11 rounded-full px-3 text-xs font-medium transition sm:px-4 ${layout === value ? 'bg-stone-950 text-white shadow-sm dark:bg-stone-50 dark:text-stone-950' : 'text-stone-500 hover:text-stone-950 dark:hover:text-white'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {layout === 't9' ? (
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-2" role="group" aria-label={keyboardCopy.t9Keyboard}>
          {t9Keys.map(({ number, letters }) => {
            const hinted = isHinted(letters, hintedInitials);
            const wrong = isWrong(letters, wrongInitials);
            const label = letters ? `${number} ${letters}` : number;
            const stateLabel = [wrong ? keyboardCopy.retryInput : '', hinted ? keyboardCopy.hintedKey : ''].filter(Boolean).join('，');
            return (
              <button
                key={`${number}-${wrong ? wrongAttempt : 0}`}
                type="button"
                disabled={disabled || !letters}
                onClick={() => onPress(groupedInitialsInput(letters))}
                aria-label={stateLabel ? `${label}，${stateLabel}` : label}
                className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-2 shadow-sm active:scale-[0.98] disabled:opacity-30 ${wrong ? 'memorize-wrong-key border-red-900 bg-red-950/10 text-red-950 ring-2 ring-red-900/20 dark:border-red-400 dark:bg-red-950/35 dark:text-red-100' : hinted ? 'border-amber-700 bg-amber-100 text-amber-950 ring-2 ring-amber-700/25 dark:border-amber-300 dark:bg-amber-300/15 dark:text-amber-100' : 'border-stone-900/10 bg-white/65 dark:border-white/10 dark:bg-white/[0.06]'}`}
              >
                <span className="text-base font-semibold">{number}</span>
                {letters && <span className={`text-[11px] tracking-[0.16em] ${wrong ? 'text-red-950 dark:text-red-100' : hinted ? 'text-amber-950 dark:text-amber-100' : 'text-stone-500 dark:text-stone-400'}`}>{letters}</span>}
              </button>
            );
          })}
        </div>
      ) : layout === 'qwerty' ? (
        <div className="space-y-1.5" role="group" aria-label={keyboardCopy.qwertyKeyboard}>
          {qwertyRows.map((row) => (
            <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
              {Array.from(row).map((letter) => (
                <button
                  key={`${letter}-${wrongInitials.includes(letter.toLocaleLowerCase()) ? wrongAttempt : 0}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPress(singleInitialInput(letter))}
                  aria-label={`${letter}${wrongInitials.includes(letter.toLocaleLowerCase()) ? `，${keyboardCopy.retryInput}` : ''}${hintedInitials.includes(letter.toLocaleLowerCase()) ? `，${keyboardCopy.hintedKey}` : ''}`}
                  className={`min-h-11 min-w-0 flex-1 rounded-lg border text-sm font-semibold shadow-sm active:scale-95 disabled:opacity-40 sm:max-w-14 ${wrongInitials.includes(letter.toLocaleLowerCase()) ? 'memorize-wrong-key border-red-900 bg-red-950/10 text-red-950 ring-2 ring-red-900/20 dark:border-red-400 dark:bg-red-950/35 dark:text-red-100' : hintedInitials.includes(letter.toLocaleLowerCase()) ? 'border-amber-700 bg-amber-100 text-amber-950 ring-2 ring-amber-700/25 dark:border-amber-300 dark:bg-amber-300/15 dark:text-amber-100' : 'border-stone-900/10 bg-white/65 dark:border-white/10 dark:bg-white/[0.06]'}`}
                >{letter}</button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="min-h-11 rounded-xl px-3 text-xs text-stone-500 transition hover:bg-white/55 hover:text-stone-950 dark:hover:bg-white/[0.06] dark:hover:text-white"
              onClick={() => setShowPhysicalKeys((visible) => !visible)}
            >
              {showPhysicalKeys ? keyboardCopy.hidePhysicalKeys : keyboardCopy.showPhysicalKeys}
            </button>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto w-[476px] space-y-1">
              {DA_CHEN_ZHUYIN_ROWS.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  role="group"
                  aria-label={`${keyboardCopy.zhuyinKeyboard} ${rowIndex + 1}`}
                  className="flex justify-center gap-1"
                >
                  {row.map(({ physicalKey, symbol }) => {
                    const hinted = hintedInitials.includes(symbol);
                    const wrong = wrongInitials.includes(symbol);
                    const keyLabel = /^[a-z]$/u.test(physicalKey) ? physicalKey.toLocaleUpperCase() : physicalKey;
                    return (
                      <button
                        key={`${symbol}-${wrong ? wrongAttempt : 0}`}
                        type="button"
                        disabled={disabled}
                        aria-label={`${showPhysicalKeys ? `${symbol} ${keyLabel}` : symbol}${wrong ? `，${keyboardCopy.retryInput}` : ''}${hinted ? `，${keyboardCopy.hintedKey}` : ''}`}
                        onClick={() => onPress(singleZhuyinInput(symbol))}
                        className={`relative flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-semibold shadow-sm transition active:scale-95 disabled:opacity-40 ${wrong ? 'memorize-wrong-key border-red-900 bg-red-950/10 text-red-950 ring-2 ring-red-900/20 dark:border-red-400 dark:bg-red-950/35 dark:text-red-100' : hinted ? 'border-amber-700 bg-amber-100 text-amber-950 ring-2 ring-amber-700/25 dark:border-amber-300 dark:bg-amber-300/15 dark:text-amber-100' : 'border-stone-900/10 bg-white/65 dark:border-white/10 dark:bg-white/[0.06]'}`}
                      >
                        {symbol}
                        {showPhysicalKeys && <span aria-hidden="true" className="absolute right-1.5 top-1 text-[8px] font-medium leading-none text-stone-400 dark:text-stone-500">{keyLabel}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isHinted(letters: string, hintedInitials: readonly string[]) {
  return Array.from(letters).some((letter) => hintedInitials.includes(letter.toLocaleLowerCase()));
}

function isWrong(letters: string, wrongInitials: readonly string[]) {
  return Boolean(letters) && Array.from(letters).some((letter) => wrongInitials.includes(letter.toLocaleLowerCase()));
}

function RecallFeedback({ language, recall, hintedInitials }: { language: Language; recall: MemorizationSession['recall']; hintedInitials: readonly string[] }) {
  const feedbackCopy = copy[language];
  const message = recall.lastAttempt === 'wrong'
    ? recall.hintVisible && hintedInitials.length > 0
      ? `${feedbackCopy.retryInput}。${feedbackCopy.hintPrefix} ${hintedInitials.map((initial) => initial.toLocaleUpperCase()).join(` ${feedbackCopy.or} `)} ${feedbackCopy.keySuffix}`
      : feedbackCopy.retryInput
    : '';
  return (
    <p role="status" aria-live="polite" className="mb-3 flex min-h-6 items-center justify-center gap-1.5 text-sm text-red-800 dark:text-red-300">
      {message && <><AlertCircle className="h-4 w-4" aria-hidden="true" />{message}</>}
    </p>
  );
}

export function VerseExercise({ session, stage }: { session: MemorizationSession; stage: MemorizationStage }) {
  let recallOrdinal = 0;
  const activeRecall = stage === 1 ? session.maskRecall.partial30
    : stage === 2 ? session.maskRecall.partial65
      : session.recall;
  const revealedPartial30 = revealedMaskIndices(session.masks.partial30, session.maskRecall.partial30.cursor);
  const revealedPartial65 = revealedMaskIndices(session.masks.partial65, session.maskRecall.partial65.cursor);
  const activeMask = stage === 1 ? session.masks.partial30 : stage === 2 ? session.masks.partial65 : null;
  const currentUnitIndex = activeMask
    ? orderedMaskIndices(activeMask)[activeRecall.cursor]
    : session.units.flatMap((unit, index) => unit.recallable ? [index] : [])[activeRecall.cursor];
  const showWrongTarget = activeRecall.lastAttempt === 'wrong';
  return (
    <p className="memorize-verse whitespace-pre-wrap" aria-live="polite">
      {session.units.map((unit, index) => {
        if (!unit.recallable) return <span key={index}>{unit.text}</span>;
        const ordinal = recallOrdinal++;
        const hidden = stage === 1 ? session.masks.partial30.has(index) && !revealedPartial30.has(index)
          : stage === 2 ? session.masks.partial65.has(index) && !revealedPartial65.has(index)
            : stage === 3 ? ordinal >= session.recall.cursor : false;
        const current = hidden && index === currentUnitIndex;
        const wrong = current && showWrongTarget;
        return <span key={`${index}-${wrong ? activeRecall.wrongAttempts : 0}`} data-current-recall={current || undefined} data-wrong={wrong || undefined} className={`${hidden ? 'memorize-hidden' : 'memorize-revealed'} ${wrong ? 'memorize-wrong-target' : ''}`}>{unit.text}</span>;
      })}
    </p>
  );
}

function revealedMaskIndices(mask: Set<number>, cursor: number): Set<number> {
  return new Set(orderedMaskIndices(mask).slice(0, cursor));
}

function VersePicker({
  verses,
  language,
  onSelect,
  guide,
}: {
  verses: Verse[];
  language: Language;
  onSelect: (verse: Verse) => void;
  guide: ReturnType<typeof useMemorizeGuide>;
}) {
  const pickerCopy = copy[language];
  return (
    <main className="memorize-page min-h-[100dvh] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="memorize-icon" aria-label={pickerCopy.backHome}><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.24em] text-stone-500">{language === 'traditional' ? 'CUVT' : 'CUV'}</span>
            <MemorizeHelpButton label={guide.helpLabel} onClick={guide.openGuide} />
          </div>
        </header>
        <section className="py-7 sm:py-10">
          <p className="text-xs tracking-[0.28em] text-amber-800/70 dark:text-amber-200/70">{pickerCopy.title}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.05em] sm:text-4xl">{pickerCopy.pickerHeading}</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{pickerCopy.pickerDescription}</p>
          <ol className="mt-6 grid grid-cols-4 gap-1.5" aria-label={pickerCopy.pickerDescription}>
            {pickerCopy.stages.map(({ name }, index) => (
              <li key={name} className="memorize-stage-tab">
                <span className="text-[10px] tabular-nums text-stone-400">{index + 1}</span>
                <span className="mt-1 block text-xs font-medium text-stone-700 dark:text-stone-300">{name}</span>
              </li>
            ))}
          </ol>
        </section>
        {verses.length === 0 ? (
          <div className="liquid-glass rounded-3xl px-6 py-14 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-4 text-lg">{pickerCopy.empty}</p>
            <Link href="/" className="memorize-primary mx-auto mt-6 max-w-xs">{pickerCopy.browse}</Link>
          </div>
        ) : (
          <div className="grid gap-3">
          {verses.map((verse) => <button key={verse.id} onClick={() => onSelect(verse)} className="liquid-glass group min-h-[88px] rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bible-700 dark:hover:bg-white/[0.07]"><span className="text-xs tracking-[0.18em] text-stone-500">{reference(verse, language)}</span><span className="mt-3 block line-clamp-4 text-lg leading-8">{verse.text}</span></button>)}
          </div>
        )}
      </div>
      {guide.dialog}
    </main>
  );
}

function StageIndicator({ stage, language }: { stage: MemorizationStage; language: Language }) {
  const stageCopy = copy[language];
  return <div className="flex items-center gap-1.5" role="progressbar" aria-label={stageCopy.stageProgress(stage + 1)} aria-valuemin={1} aria-valuemax={stageNeedsInitials.length} aria-valuenow={stage + 1}>{stageCopy.stages.map(({ name }, index) => <span key={name} className={`h-1.5 rounded-full transition-all ${index === stage ? 'w-8 bg-amber-800 dark:bg-amber-200' : index < stage ? 'w-4 bg-amber-800/35 dark:bg-amber-200/35' : 'w-4 bg-stone-900/10 dark:bg-white/10'}`} title={name} />)}</div>;
}

function stageInstruction(stage: MemorizationStage, language: Language, keyboardLayout: KeyboardLayout) {
  if (stage === finalStage && keyboardLayout === 'zhuyin') return copy[language].zhuyinInstruction;
  return copy[language].stages[stage].instruction;
}

function reference(verse: Verse, language: Language) {
  const book = booksData.books.find((candidate) => candidate.key === verse.bookKey);
  const name = book ? (language === 'traditional' ? book.nameTraditional : book.nameSimplified) : verse.book;
  return `${name} ${verse.chapter}:${verse.verse}`;
}

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
