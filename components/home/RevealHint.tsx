'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export const HOME_HINT_DISMISSED_KEY = 'home-hint-dismissed:v1';
/** Set on <html> before paint by the inline script in app/layout.tsx when the hint was dismissed. */
export const HOME_HINT_DISMISSED_CLASS = 'home-hint-dismissed';

/** Inline <head> script: hides a dismissed hint before first paint (no flash, no layout shift). */
export const HOME_HINT_BOOT_SCRIPT = `try{if(localStorage.getItem('${HOME_HINT_DISMISSED_KEY}')==='1')document.documentElement.classList.add('${HOME_HINT_DISMISSED_CLASS}')}catch(e){}`;

type Props = {
  language: 'simplified' | 'traditional';
  /** Current card mode; the top-right toggle is labelled 背诵 while showing full text, 阅读 otherwise. */
  showAllContent: boolean;
};

/**
 * One-line amber pill under the home status bar explaining tap-to-reveal and the global toggle.
 * Always server-rendered so it never pops in; a dismissed hint is hidden pre-paint via HOME_HINT_DISMISSED_CLASS.
 */
export default function RevealHint({ language, showAllContent }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const t = language === 'traditional';
  const button = showAllContent ? (t ? '背誦' : '背诵') : t ? '閱讀' : '阅读';

  const dismiss = () => {
    setDismissed(true);
    document.documentElement.classList.add(HOME_HINT_DISMISSED_CLASS);
    try {
      localStorage.setItem(HOME_HINT_DISMISSED_KEY, '1');
    } catch {
      // localStorage unavailable: dismissal lasts for this session only.
    }
  };

  return (
    <div
      data-testid="home-reveal-hint"
      className="home-reveal-hint mt-3 flex h-7 w-fit max-w-full items-center gap-1 whitespace-nowrap rounded-full border border-amber-300/70 bg-amber-50 pl-3 pr-1 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 font-chinese"
      role="note"
    >
      <span className="truncate">
        <span className="sm:hidden">
          {t ? `👆 點卡片遮字/顯示 · 右上角「${button}」切換全部` : `👆 点卡片遮字/显示 · 右上角「${button}」切换全部`}
        </span>
        <span className="hidden sm:inline">
          {t
            ? `👆 點卡片可單獨遮字/顯示 · 點右上角「${button}」切換全部`
            : `👆 点卡片可单独遮字/显示 · 点右上角「${button}」切换全部`}
        </span>
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-amber-200/60 dark:hover:bg-amber-500/20"
        aria-label={t ? '關閉提示' : '关闭提示'}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
