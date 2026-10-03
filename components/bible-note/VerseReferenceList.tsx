'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { VerseReference } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import VerseCard from './VerseCard';
import { useScriptPick } from '@/lib/useScriptPick';

interface VerseWithText extends VerseReference {
    text: string | null;
}

interface VerseReferenceListProps {
    references: VerseReference[];
    onViewChapter: (book: string, chapter: number, verse?: number) => void;
    onExpandAll: () => void;
    isExpanding?: boolean;
}

export default function VerseReferenceList({
    references,
    onViewChapter,
    onExpandAll,
    isExpanding = false,
}: VerseReferenceListProps) {
    const pick = useScriptPick();
    const [versesWithText, setVersesWithText] = useState<VerseWithText[]>([]);
    const [loading, setLoading] = useState(false);

    // 加载经文内容
    useEffect(() => {
        let cancelled = false;

        if (references.length === 0) {
            setVersesWithText([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const loadVerses = async () => {
            const verses = await Promise.all(
                references.map(async (ref) => {
                    const text = await getVerseText(ref.book, ref.chapter, ref.startVerse);
                    return { ...ref, text };
                })
            );
            if (!cancelled) {
                setVersesWithText(verses);
                setLoading(false);
            }
        };

        void loadVerses();

        return () => {
            cancelled = true;
        };
    }, [references]);

    if (loading) {
        return (
            <div className="notebook-side-panel rounded-[1.75rem] border border-stone-900/10 bg-white/70 p-4 shadow-[0_14px_42px_rgba(68,64,60,0.06)] backdrop-blur-xl">
                <div className="flex items-center justify-center py-4 md:py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-600 dark:text-stone-400" />
                    <span className="ml-2 text-sm text-stone-600 dark:text-stone-400 font-chinese">
                        {pick('加載經文中...', '加载经文中...')}
                    </span>
                </div>
            </div>
        );
    }

    if (references.length === 0) {
        return (
            <div className="notebook-side-panel rounded-[1.75rem] border border-stone-900/10 bg-white/70 p-4 shadow-[0_14px_42px_rgba(68,64,60,0.06)] backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <BookOpen className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    <h3 className="font-bold text-stone-950 dark:text-stone-50 font-chinese">
                        {pick('經文邊注', '经文边注')}
                    </h3>
                </div>
                <p className="py-8 text-center font-chinese text-sm text-stone-500 dark:text-stone-400">
                    {pick('還沒有引用經文', '还没有引用经文')}
                    <br />
                    <span className="notebook-helper-pill mt-2 inline-flex rounded-full border border-stone-900/10 bg-white/70 px-3 py-1 text-xs text-stone-500">{pick('試著輸入 約3:16 或 John 3:17', '试着输入 约3:16 或 John 3:17')}</span>
                </p>
            </div>
        );
    }

    return (
        <div className="notebook-side-panel rounded-[1.75rem] border border-stone-900/10 bg-white/70 p-4 shadow-[0_14px_42px_rgba(68,64,60,0.06)] backdrop-blur-xl">
            {/* 标题和操作按钮 */}
            <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    <h3 className="font-bold text-stone-950 dark:text-stone-50 font-chinese">
                        {pick('經文邊注', '经文边注')}
                        <span className="ml-2 text-sm font-normal text-stone-500 dark:text-stone-400">
                            ({versesWithText.length})
                        </span>
                    </h3>
                </div>

                {/* 展开所有经文按钮 */}
                <button
                    onClick={onExpandAll}
                    disabled={isExpanding}
                    className="flex min-h-[32px] items-center gap-1 rounded-full border border-stone-900/10 bg-white/72 px-3 py-1.5 text-xs text-stone-700 transition-colors hover:bg-white disabled:opacity-50 dark:border-amber-200/10 dark:bg-[#2a2117] dark:text-stone-200 dark:hover:bg-white/[0.08] touch-manipulation"
                    title={pick('將所有經文完整內容插入筆記', '将所有经文完整内容插入笔记')}
                >
                    {isExpanding ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="font-chinese">{pick('展開中...', '展开中...')}</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3 h-3" />
                            <span className="font-chinese">{pick('展開所有經文', '展开所有经文')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* 经文列表 */}
            <div className="space-y-2">
                {versesWithText.map((verse, index) => (
                    <VerseCard
                        key={`${verse.book}-${verse.chapter}-${verse.startVerse}-${index}`}
                        reference={verse.original}
                        book={verse.book}
                        chapter={verse.chapter}
                        verse={verse.startVerse}
                        text={verse.text}
                        onViewChapter={() => onViewChapter(verse.book, verse.chapter, verse.startVerse)}
                    />
                ))}
            </div>
        </div>
    );
}

