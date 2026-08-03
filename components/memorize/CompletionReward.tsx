'use client';

import { CheckCircle2, MinusCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Language } from '@/types/verse';

const rewardCopy = {
  simplified: {
    independentSeal: '熟记',
    assistedSeal: '渐熟',
    roundSeal: '藏于心',
    independentMessage: '本阶段未使用提示，已独立完成。',
    assistedMessage: (count: number) => `本阶段借助了 ${count} 次提示，继续慢慢熟悉。`,
    skippedMessage: '本阶段已跳过，不计作完成。',
    roundMessage: (assistanceCount: number, skippedStageCount: number) => {
      if (assistanceCount === 0 && skippedStageCount === 0) return '本轮未使用提示，也没有跳过阶段。';
      const assistance = assistanceCount === 0 ? '未使用提示' : `使用了 ${assistanceCount} 次提示`;
      const skipped = skippedStageCount === 0 ? '没有跳过阶段' : `跳过了 ${skippedStageCount} 个阶段`;
      return `本轮${assistance}，${skipped}。`;
    },
    sealLabel: (seal: string) => `${seal}朱印`,
  },
  traditional: {
    independentSeal: '熟記',
    assistedSeal: '漸熟',
    roundSeal: '藏於心',
    independentMessage: '本階段未使用提示，已獨立完成。',
    assistedMessage: (count: number) => `本階段借助了 ${count} 次提示，繼續慢慢熟悉。`,
    skippedMessage: '本階段已跳過，不計作完成。',
    roundMessage: (assistanceCount: number, skippedStageCount: number) => {
      if (assistanceCount === 0 && skippedStageCount === 0) return '本輪未使用提示，也沒有跳過階段。';
      const assistance = assistanceCount === 0 ? '未使用提示' : `使用了 ${assistanceCount} 次提示`;
      const skipped = skippedStageCount === 0 ? '沒有跳過階段' : `跳過了 ${skippedStageCount} 個階段`;
      return `本輪${assistance}，${skipped}。`;
    },
    sealLabel: (seal: string) => `${seal}朱印`,
  },
} as const;

interface CompletionRewardProps {
  kind: 'stage' | 'round';
  language: Language;
  assistanceCount: number;
  skippedStageCount: number;
  reducedMotion?: boolean;
}

export function CompletionReward({
  kind,
  language,
  assistanceCount,
  skippedStageCount,
  reducedMotion,
}: CompletionRewardProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion ?? Boolean(prefersReducedMotion);
  const messages = rewardCopy[language];
  const skipped = kind === 'stage' && skippedStageCount > 0;
  const seal = kind === 'round'
    ? messages.roundSeal
    : assistanceCount > 0 ? messages.assistedSeal : messages.independentSeal;
  const message = kind === 'round'
    ? messages.roundMessage(assistanceCount, skippedStageCount)
    : skipped ? messages.skippedMessage
      : assistanceCount > 0 ? messages.assistedMessage(assistanceCount) : messages.independentMessage;
  const duration = shouldReduceMotion ? 0.2 : kind === 'round' ? 1.05 : 0.62;

  if (skipped) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-2xl border border-stone-900/10 bg-white/40 px-4 py-3 text-sm text-stone-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-stone-300"
      >
        <MinusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration }}
      className={`mx-auto flex items-center justify-center gap-4 ${kind === 'round' ? 'flex-col' : 'max-w-xl rounded-3xl border border-stone-900/10 bg-white/40 px-4 py-4 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row'}`}
    >
      <Seal seal={seal} label={messages.sealLabel(seal)} kind={kind} assisted={assistanceCount > 0} reducedMotion={shouldReduceMotion} />
      <div className={kind === 'round' ? 'text-center' : 'min-w-0 text-left'}>
        <p className="flex items-center justify-center gap-1.5 font-serif text-lg font-semibold tracking-[0.12em] text-stone-900 dark:text-stone-100 sm:justify-start">
          <CheckCircle2 className="h-4 w-4 text-[#963a30] dark:text-[#d58375]" aria-hidden="true" />
          {seal}
        </p>
        <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-300">{message}</p>
      </div>
    </motion.div>
  );
}

function Seal({
  seal,
  label,
  kind,
  assisted,
  reducedMotion,
}: {
  seal: string;
  label: string;
  kind: 'stage' | 'round';
  assisted: boolean;
  reducedMotion: boolean;
}) {
  const size = kind === 'round' ? 124 : 82;
  const characters = Array.from(seal);
  const textSize = characters.length >= 4 ? 22 : characters.length === 3 ? 25 : 29;
  const step = characters.length >= 4 ? 25 : characters.length === 3 ? 30 : 34;
  const startY = 60 - ((characters.length - 1) * step) / 2;

  return (
    <motion.div
      className="relative shrink-0 pointer-events-none"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: kind === 'round' ? -18 : -12, rotate: -4, scale: 1.12 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: assisted ? 0.7 : 0.92, y: 0, rotate: -1.5, scale: 1 }}
      transition={{ duration: reducedMotion ? 0.2 : kind === 'round' ? 1.05 : 0.62, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: size, height: size }}
    >
      {!reducedMotion && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-[18%] rounded-full bg-[#a13b31]/10 blur-md dark:bg-[#d17668]/10"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.75, 0.22], scale: [0.4, 1.35, 1.1] }}
          transition={{ duration: kind === 'round' ? 1.05 : 0.62, times: [0, 0.55, 1] }}
        />
      )}
      <svg viewBox="0 0 120 120" role="img" aria-label={label} className="relative h-full w-full overflow-visible text-[#963a30] dark:text-[#d58375]">
        <rect x="12" y="11" width="96" height="98" rx="5" fill="none" stroke="currentColor" strokeWidth="5" />
        <path d="M18 16 C42 8 77 15 103 12 M108 33 C101 57 110 85 102 104 M15 88 C27 109 62 103 87 108" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.72" />
        <text
          x="60"
          y={startY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontFamily="ui-serif, 'Songti SC', 'Noto Serif CJK TC', serif"
          fontSize={textSize}
          fontWeight="700"
        >
          {characters.map((character, index) => (
            <tspan key={`${character}-${index}`} x="60" y={startY + index * step}>{character}</tspan>
          ))}
        </text>
      </svg>
      {!reducedMotion && (
        <span aria-hidden="true" className="absolute -bottom-1 right-0 h-1.5 w-1.5 rounded-full bg-[#963a30]/45 dark:bg-[#d58375]/45" />
      )}
    </motion.div>
  );
}
