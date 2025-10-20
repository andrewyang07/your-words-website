'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

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
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600 hover:border-bible-400 dark:hover:border-bible-500 transition-colors"
        >
            {/* 经文引用标题 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-bible-700 dark:text-bible-300 font-chinese">
                    {reference}
                </h4>
                <button
                    onClick={onViewChapter}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-bible-500 hover:bg-bible-600 text-white rounded transition-colors touch-manipulation min-h-[32px] shadow-sm"
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
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-chinese font-medium">
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

