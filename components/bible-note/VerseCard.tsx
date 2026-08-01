'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { getReaderTextStyle } from '@/lib/readerPreferences';
import { useReaderPreferencesStore } from '@/stores/useReaderPreferencesStore';

interface VerseCardProps {
    reference: string; // 如 "约3:16"
    book: string; // 如 "约翰福音"
    chapter: number;
    verse: number;
    text: string | null;
    onViewChapter: () => void;
}

export default function VerseCard({
    reference,
    book,
    chapter,
    verse,
    text,
    onViewChapter,
}: VerseCardProps) {
    const textSize = useReaderPreferencesStore((state) => state.textSize);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-stone-900/10 bg-stone-50/70 p-3 transition-colors hover:border-amber-500/30 hover:bg-white/75 dark:border-amber-200/12 dark:bg-[#211b13]/70 dark:hover:bg-white/[0.06]"
        >
            {/* 经文引用标题 */}
            <div className="flex items-center justify-between mb-1.5">
                <h4
                    className="reader-text font-chinese font-semibold text-stone-900 dark:text-stone-100"
                    style={getReaderTextStyle(textSize, '14px') as React.CSSProperties}
                >
                    {reference}
                </h4>
                <button
                    onClick={onViewChapter}
                    className="flex min-h-[32px] items-center gap-1 rounded-full border border-stone-900/10 bg-white/80 px-2 py-1 text-xs text-stone-600 shadow-sm transition-colors hover:bg-white hover:text-stone-950 dark:border-amber-200/10 dark:bg-[#2a2117] dark:text-stone-300 dark:hover:bg-white/[0.08] touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                    title={`查看 ${book} 第 ${chapter} 章`}
                    aria-label={`查看 ${book} 第 ${chapter} 章`}
                >
                    <BookOpen className="w-3 h-3" />
                    <span className="font-chinese">查看整章</span>
                </button>
            </div>

            {/* 经文内容 */}
            {text ? (
                <p
                    className="reader-text font-chinese font-medium leading-relaxed text-stone-700 dark:text-stone-200"
                    style={getReaderTextStyle(textSize, '14px') as React.CSSProperties}
                >
                    {text}
                </p>
            ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic font-chinese">
                    未找到此經文
                </p>
            )}
        </motion.div>
    );
}
