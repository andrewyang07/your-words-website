'use client';

import { RotateCcw } from 'lucide-react';
import {
  DEFAULT_READER_TEXT_SIZE,
  READER_TEXT_SIZES,
  getNextReaderTextSize,
  getReaderTextSizeLabel,
  type ReaderTextSize,
} from '@/lib/readerPreferences';
import { useReaderPreferencesStore } from '@/stores/useReaderPreferencesStore';

type ReaderLanguage = 'simplified' | 'traditional';

interface ReaderTextSizeControlProps {
  language: ReaderLanguage;
}

interface SizeStepButtonProps {
  label: string;
  text: string;
  disabled: boolean;
  onClick: () => void;
}

interface ReaderSizeStepperProps {
  copy: ReaderControlCopy;
  language: ReaderLanguage;
  textSize: ReaderTextSize;
  setTextSize: (size: ReaderTextSize) => void;
}

interface ReaderControlCopy {
  groupLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  resetLabel: string;
}

const READER_CONTROL_COPY: Record<ReaderLanguage, ReaderControlCopy> = {
  simplified: {
    groupLabel: '经文字体大小',
    decreaseLabel: '缩小经文字体',
    increaseLabel: '放大经文字体',
    resetLabel: '重置字体',
  },
  traditional: {
    groupLabel: '經文字體大小',
    decreaseLabel: '縮小經文字體',
    increaseLabel: '放大經文字體',
    resetLabel: '重設字體',
  },
};

const MIN_READER_TEXT_SIZE = READER_TEXT_SIZES[0];
const MAX_READER_TEXT_SIZE = READER_TEXT_SIZES[READER_TEXT_SIZES.length - 1];

function SizeStepButton({ label, text, disabled, onClick }: SizeStepButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg font-semibold text-stone-700 transition hover:bg-white disabled:cursor-default disabled:opacity-35 dark:text-stone-200 dark:hover:bg-white/[0.08]"
      aria-label={label}
    >
      {text}
    </button>
  );
}

function ReaderSizeStepper({ copy, language, textSize, setTextSize }: ReaderSizeStepperProps) {
  const label = getReaderTextSizeLabel(textSize, language);
  return (
    <div className="flex min-h-[44px] items-center rounded-xl border border-stone-900/10 bg-white/55 p-1 dark:border-white/10 dark:bg-white/[0.04]">
      <SizeStepButton
        onClick={() => setTextSize(getNextReaderTextSize(textSize, -1))}
        disabled={textSize === MIN_READER_TEXT_SIZE}
        label={copy.decreaseLabel}
        text="A−"
      />
      <div className="min-w-[76px] px-1.5 text-center font-chinese" aria-live="polite">
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{label}</p>
        <p className="text-xs tabular-nums text-stone-500 dark:text-stone-400">{textSize}%</p>
      </div>
      <SizeStepButton
        onClick={() => setTextSize(getNextReaderTextSize(textSize, 1))}
        disabled={textSize === MAX_READER_TEXT_SIZE}
        label={copy.increaseLabel}
        text="A+"
      />
    </div>
  );
}

export default function ReaderTextSizeControl({ language }: ReaderTextSizeControlProps) {
  const { textSize, setTextSize, resetTextSize } = useReaderPreferencesStore();
  const copy = READER_CONTROL_COPY[language];

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={copy.groupLabel}>
      <ReaderSizeStepper copy={copy} language={language} textSize={textSize} setTextSize={setTextSize} />
      <button
        type="button"
        onClick={resetTextSize}
        disabled={textSize === DEFAULT_READER_TEXT_SIZE}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs text-stone-600 transition hover:bg-stone-900/5 disabled:cursor-default disabled:opacity-35 dark:text-stone-300 dark:hover:bg-white/[0.07] font-chinese"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {copy.resetLabel}
      </button>
    </div>
  );
}
