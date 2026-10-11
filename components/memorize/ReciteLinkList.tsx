'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, Check, Share2 } from 'lucide-react';
import { MAX_RECITE_VERSES } from '@/lib/reciteLink';
import { verseReference } from '@/lib/memorize/reference';
import type { Language, Verse } from '@/types/verse';

export const reciteListCopy = {
  simplified: {
    defaultTitle: '背诵链接', count: (n: number) => `共 ${n} 节`, share: '分享此链接', backHome: '返回首页',
    newerSchema: '此链接来自较新版本，部分内容可能无法显示',
    truncated: `仅显示前 ${MAX_RECITE_VERSES} 节`,
    invalid: (n: number) => `有 ${n} 处引用无法识别，已略过`,
    empty: '链接中没有可背诵的经文', toFavorites: '去我的收藏', done: '已背完',
  },
  traditional: {
    defaultTitle: '背誦連結', count: (n: number) => `共 ${n} 節`, share: '分享此連結', backHome: '返回首頁',
    newerSchema: '此連結來自較新版本，部分內容可能無法顯示',
    truncated: `僅顯示前 ${MAX_RECITE_VERSES} 節`,
    invalid: (n: number) => `有 ${n} 處引用無法識別，已略過`,
    empty: '連結中沒有可背誦的經文', toFavorites: '去我的收藏', done: '已背完',
  },
} as const;

export default function ReciteLinkList({
  verses,
  language,
  title,
  invalidCount,
  truncated,
  newerSchema,
  completedIds,
  onSelect,
  onShare,
  helpButton,
  children,
}: {
  verses: Verse[];
  language: Language;
  title: string | null;
  invalidCount: number;
  truncated: boolean;
  newerSchema: boolean;
  completedIds: ReadonlySet<string>;
  onSelect: (verse: Verse) => void;
  onShare: () => void;
  helpButton?: ReactNode;
  children?: ReactNode;
}) {
  const text = reciteListCopy[language];
  const notices = [
    newerSchema ? text.newerSchema : null,
    truncated ? text.truncated : null,
    invalidCount > 0 ? text.invalid(invalidCount) : null,
  ].filter((notice): notice is string => Boolean(notice));

  return (
    <main className="memorize-page min-h-[100dvh] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="memorize-icon" aria-label={text.backHome}><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.24em] text-stone-500">{language === 'traditional' ? 'CUVT' : 'CUV'}</span>
            {verses.length > 0 && (
              <button type="button" onClick={onShare} className="memorize-secondary !w-auto px-3 text-sm"><Share2 className="h-4 w-4" />{text.share}</button>
            )}
            {helpButton}
          </div>
        </header>
        <section className="py-7 sm:py-10">
          <h1 className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">{title ?? text.defaultTitle}</h1>
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{text.count(verses.length)}</p>
        </section>
        {notices.length > 0 && (
          <div role="status" className="mb-4 space-y-1 rounded-2xl border border-amber-700/20 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
            {notices.map((notice) => <p key={notice}>{notice}</p>)}
          </div>
        )}
        {verses.length === 0 ? (
          <div className="liquid-glass rounded-3xl px-6 py-14 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-4 text-lg">{text.empty}</p>
            <a href="/memorize" className="memorize-primary mx-auto mt-6 max-w-xs">{text.toFavorites}</a>
          </div>
        ) : (
          <ol className="grid gap-3">
            {verses.map((verse) => {
              const done = completedIds.has(verse.id);
              return (
                <li key={verse.id}>
                  <button type="button" onClick={() => onSelect(verse)} className="liquid-glass group min-h-[88px] w-full rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bible-700 dark:hover:bg-white/[0.07]">
                    <span className="flex items-center justify-between gap-2 text-xs tracking-[0.18em] text-stone-500">
                      {verseReference(verse, language)}
                      {done && <span className="flex items-center gap-1 text-[#963a30] dark:text-[#d58375]"><Check className="h-4 w-4" aria-hidden="true" />{text.done}</span>}
                    </span>
                    <span className="mt-3 block line-clamp-4 text-lg leading-8">{verse.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {children}
      </div>
    </main>
  );
}
