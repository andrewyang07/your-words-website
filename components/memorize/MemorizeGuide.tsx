'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpenCheck, ChevronRight, Eye, HelpCircle, Keyboard, X } from 'lucide-react';
import type { Language } from '@/types/verse';

export const MEMORIZE_GUIDE_STORAGE_KEY = 'your-words:memorize-guide:v3';

type GuidePage = 'overview' | 'input' | 'zhuyin';
type GuideSurface = 'picker' | 'reading' | 'input' | 'complete';

interface GuideProgress {
  version: 3;
  pickerSeen: boolean;
  inputSeen: boolean;
  zhuyinSeen: boolean;
  dismissed: boolean;
}

const initialProgress: GuideProgress = {
  version: 3,
  pickerSeen: false,
  inputSeen: false,
  zhuyinSeen: false,
  dismissed: false,
};

const guideCopy = {
  simplified: {
    help: '帮助', close: '关闭帮助', skip: '跳过引导', done: '知道了', next: '下一步：输入提示', nextZhuyin: '下一步：注音说明', onlyZhuyin: '只看注音说明',
    overviewTitle: '这样开始深度背诵', overviewLead: '一轮只练一节经文',
    overviewBody: '从完整阅读开始，逐步减少文字线索。每个阶段都可以跳过，不会记录分数或进度。',
    stages: [
      ['通读', '先安静读一遍'], ['轻遮', '凭多数文字补全'], ['深遮', '只留少量线索'], ['首字母', '逐字按下读音首字母'],
    ],
    inputTitle: '逐字回想时',
    inputError: '按键错误不会前进；连续两次后会提示正确按键。',
    inputEscape: '想不起来时，可以“显示这个字”，也可以跳过当前阶段。',
    zhuyinTitle: '注音只按第一个符号',
    zhuyinBody: '每个汉字只按读音的第一个注音符号，不需要拼完音节，也不用声调。',
    zhuyinExample: '神 shén → ㄕ',
    zhuyinPhysical: '电脑端可直接按台湾大千键位；键盘上的字母角标可随时隐藏。',
  },
  traditional: {
    help: '幫助', close: '關閉幫助', skip: '跳過引導', done: '知道了', next: '下一步：輸入提示', nextZhuyin: '下一步：注音說明', onlyZhuyin: '只看注音說明',
    overviewTitle: '這樣開始深度背誦', overviewLead: '一輪只練一節經文',
    overviewBody: '從完整閱讀開始，逐步減少文字線索。每個階段都可以跳過，不會記錄分數或進度。',
    stages: [
      ['通讀', '先安靜讀一遍'], ['輕遮', '憑多數文字補全'], ['深遮', '只留少量線索'], ['首字母', '逐字按下讀音首字母'],
    ],
    inputTitle: '逐字回想時',
    inputError: '按鍵錯誤不會前進；連續兩次後會提示正確按鍵。',
    inputEscape: '想不起來時，可以「顯示這個字」，也可以跳過目前階段。',
    zhuyinTitle: '注音只按第一個符號',
    zhuyinBody: '每個漢字只按讀音的第一個注音符號，不需要拼完音節，也不用聲調。',
    zhuyinExample: '神 shén → ㄕ',
    zhuyinPhysical: '電腦端可直接按台灣大千鍵位；鍵盤上的字母角標可隨時隱藏。',
  },
} as const;

function readProgress(): GuideProgress {
  try {
    const stored = window.localStorage.getItem(MEMORIZE_GUIDE_STORAGE_KEY);
    if (!stored) return initialProgress;
    const value = JSON.parse(stored) as Partial<GuideProgress>;
    if (value.version !== initialProgress.version) return initialProgress;
    return {
      version: 3,
      pickerSeen: Boolean(value.pickerSeen),
      inputSeen: Boolean(value.inputSeen),
      zhuyinSeen: Boolean(value.zhuyinSeen),
      dismissed: Boolean(value.dismissed),
    };
  } catch {
    return initialProgress;
  }
}

function writeProgress(progress: GuideProgress) {
  try {
    window.localStorage.setItem(MEMORIZE_GUIDE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // The guide remains usable when private browsing or storage policy blocks persistence.
  }
}

export function useMemorizeGuide(surface: GuideSurface, language: Language) {
  const [progress, setProgress] = useState<GuideProgress>(initialProgress);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState<GuidePage | null>(null);
  const [replayingAll, setReplayingAll] = useState(false);

  useEffect(() => {
    setProgress(readProgress());
    setHydrated(true);
  }, []);

  const automaticPage: GuidePage | null = !hydrated || progress.dismissed
    ? null
    : surface === 'picker' && !progress.pickerSeen
      ? 'overview'
      : surface === 'input' && !progress.inputSeen
        ? 'input'
        : null;
  const visiblePage = page ?? automaticPage;

  const save = useCallback((next: GuideProgress) => {
    setProgress(next);
    writeProgress(next);
  }, []);

  const openGuide = useCallback(() => {
    setReplayingAll(true);
    setPage('overview');
  }, []);

  const openZhuyinGuide = useCallback(() => {
    setReplayingAll(false);
    setPage('zhuyin');
  }, []);

  const showZhuyinCoach = useCallback(() => {
    if (hydrated && !progress.dismissed && !progress.zhuyinSeen) {
      setReplayingAll(false);
      setPage('zhuyin');
    }
  }, [hydrated, progress.dismissed, progress.zhuyinSeen]);

  const skipGuide = useCallback(() => {
    save({ version: 3, pickerSeen: true, inputSeen: true, zhuyinSeen: true, dismissed: true });
    setReplayingAll(false);
    setPage(null);
  }, [save]);

  const finishPage = useCallback((currentPage: GuidePage) => {
    if (currentPage === 'overview' && replayingAll) {
      save({ ...progress, pickerSeen: true });
      setPage('input');
      return;
    }
    if (currentPage === 'input' && replayingAll) {
      save({ ...progress, inputSeen: true });
      setPage('zhuyin');
      return;
    }
    const next = {
      ...progress,
      pickerSeen: progress.pickerSeen || currentPage === 'overview',
      inputSeen: progress.inputSeen || currentPage === 'input',
      zhuyinSeen: progress.zhuyinSeen || currentPage === 'zhuyin',
    };
    save(next);
    setReplayingAll(false);
    setPage(null);
  }, [progress, replayingAll, save]);

  return {
    helpLabel: guideCopy[language].help,
    openGuide,
    openZhuyinGuide,
    showZhuyinCoach,
    dialog: visiblePage ? (
      <MemorizeGuideDialog
        language={language}
        page={visiblePage}
        nextLabel={replayingAll && visiblePage === 'overview' ? guideCopy[language].next : replayingAll && visiblePage === 'input' ? guideCopy[language].nextZhuyin : null}
        onContinue={() => finishPage(visiblePage)}
        onSkip={skipGuide}
        onZhuyin={openZhuyinGuide}
      />
    ) : null,
  };
}

function MemorizeGuideDialog({
  language,
  page,
  nextLabel,
  onContinue,
  onSkip,
  onZhuyin,
}: {
  language: Language;
  page: GuidePage;
  nextLabel: string | null;
  onContinue: () => void;
  onSkip: () => void;
  onZhuyin: () => void;
}) {
  const text = guideCopy[language];
  const primaryRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    primaryRef.current?.focus();
    return () => previousFocus?.focus();
  }, [page]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onSkip();
        return;
      }
      if (event.key !== 'Tab') {
        event.stopPropagation();
        return;
      }
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])') ?? []);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onSkip]);

  const title = page === 'overview' ? text.overviewTitle : page === 'input' ? text.inputTitle : text.zhuyinTitle;
  return (
    <div className="fixed inset-0 z-[10020] flex items-end justify-center bg-stone-950/35 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="memorize-guide-title"
        className="liquid-glass w-full max-w-lg rounded-[1.75rem] bg-[#faf7ef]/95 p-5 shadow-[0_28px_90px_rgba(28,25,23,0.24)] dark:bg-[#1a1814]/95 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="yw-icon-tile h-11 w-11 rounded-2xl text-bible-700 dark:text-bible-200">
              {page === 'overview' ? <BookOpenCheck className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
            </span>
            <h2 id="memorize-guide-title" className="text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">{title}</h2>
          </div>
          <button type="button" onClick={onSkip} className="memorize-icon -mr-1 -mt-1" aria-label={text.close}><X className="h-4 w-4" /></button>
        </div>

        {page === 'overview' ? (
          <div className="mt-6">
            <p className="text-base font-medium text-stone-900 dark:text-stone-100">{text.overviewLead}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{text.overviewBody}</p>
            <ol className="mt-5 grid grid-cols-2 gap-2" aria-label={text.overviewLead}>
              {text.stages.map(([name, description], index) => (
                <li key={name} className="rounded-2xl border border-stone-900/10 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.045]">
                  <span className="text-[11px] tabular-nums text-bible-700 dark:text-bible-200">{index + 1}/4</span>
                  <span className="mt-1 block text-sm font-semibold">{name}</span>
                  <span className="mt-1 block text-xs leading-5 text-stone-500 dark:text-stone-400">{description}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : page === 'input' ? (
          <div className="mt-6 space-y-3">
            <div className="flex gap-3 rounded-2xl border border-stone-900/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.045]">
              <Keyboard className="mt-0.5 h-5 w-5 shrink-0 text-bible-700 dark:text-bible-200" />
              <p className="text-sm leading-6 text-stone-700 dark:text-stone-300">{text.inputError}</p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-stone-900/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.045]">
              <Eye className="mt-0.5 h-5 w-5 shrink-0 text-bible-700 dark:text-bible-200" />
              <p className="text-sm leading-6 text-stone-700 dark:text-stone-300">{text.inputEscape}</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm leading-6 text-stone-700 dark:text-stone-300">{text.zhuyinBody}</p>
            <div className="rounded-2xl border border-stone-900/10 bg-white/55 p-4 text-center dark:border-white/10 dark:bg-white/[0.045]">
              <p className="text-xl font-semibold tracking-[0.08em] text-bible-800 dark:text-bible-100">{text.zhuyinExample}</p>
            </div>
            <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">{text.zhuyinPhysical}</p>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button ref={primaryRef} type="button" onClick={onContinue} className="memorize-primary">
            {nextLabel ?? text.done}{nextLabel && <ChevronRight className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onSkip} className="memorize-secondary px-5 sm:w-auto">{text.skip}</button>
          {page !== 'zhuyin' && <button type="button" onClick={onZhuyin} className="min-h-11 text-sm text-stone-500 underline-offset-4 hover:underline sm:col-span-2">{text.onlyZhuyin}</button>}
        </div>
      </section>
    </div>
  );
}

export function MemorizeHelpButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="memorize-help" aria-label={label}>
      <HelpCircle className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
