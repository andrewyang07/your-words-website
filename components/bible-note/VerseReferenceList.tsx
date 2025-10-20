'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { VerseReference } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import VerseCard from './VerseCard';

interface VerseWithText extends VerseReference {
    text: string | null;
}

interface VerseReferenceListProps {
    references: VerseReference[];
    onViewChapter: (book: string, chapter: number) => void;
    onExpandAll: () => void;
    isExpanding?: boolean;
}

export default function VerseReferenceList({
    references,
    onViewChapter,
    onExpandAll,
    isExpanding = false,
}: VerseReferenceListProps) {
    const [versesWithText, setVersesWithText] = useState<VerseWithText[]>([]);
    const [loading, setLoading] = useState(false);

    // 加载经文内容
    useEffect(() => {
        if (references.length === 0) {
            setVersesWithText([]);
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
            setVersesWithText(verses);
            setLoading(false);
        };

        loadVerses();
    }, [references]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-3 md:p-4">
                <div className="flex items-center justify-center py-4 md:py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-bible-600 dark:text-bible-400" />
                    <span className="ml-2 text-sm text-bible-600 dark:text-bible-400 font-chinese">
                        加載經文中...
                    </span>
                </div>
            </div>
        );
    }

    if (references.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <BookOpen className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    <h3 className="font-bold text-bible-800 dark:text-bible-200 font-chinese">
                        引用的經文
                    </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 md:py-6 font-chinese">
                    尚未引用任何經文
                    <br />
                    <span className="text-xs">試著輸入「约3:16」或「马太福音5:3」</span>
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-3 md:p-4">
            {/* 标题和操作按钮 */}
            <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    <h3 className="font-bold text-bible-800 dark:text-bible-200 font-chinese">
                        引用的經文
                        <span className="ml-2 text-sm font-normal text-bible-500 dark:text-bible-400">
                            ({versesWithText.length})
                        </span>
                    </h3>
                </div>

                {/* 展开所有经文按钮 */}
                <button
                    onClick={onExpandAll}
                    disabled={isExpanding}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 text-white rounded-lg transition-colors touch-manipulation min-h-[32px]"
                    title="將所有經文完整內容插入筆記"
                >
                    {isExpanding ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="font-chinese">展開中...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3 h-3" />
                            <span className="font-chinese">展開所有經文</span>
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
                        onViewChapter={() => onViewChapter(verse.book, verse.chapter)}
                    />
                ))}
            </div>
        </div>
    );
}

