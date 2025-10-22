'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ChevronRight } from 'lucide-react';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import booksData from '@/public/data/books.json';

interface RankingItem {
    verseId: string;
    favorites: number;
    text?: string;
}

interface RankingsListProps {
    rankings: RankingItem[];
}

export default function RankingsList({ rankings }: RankingsListProps) {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavoritesStore();

    // 解析 verseId 并获取书卷信息
    const enrichedRankings = useMemo(() => {
        return rankings.map((item) => {
            const [bookIndexStr, chapterStr, verseStr] = item.verseId.split('-');
            const bookIndex = parseInt(bookIndexStr);
            const chapter = parseInt(chapterStr);
            const verse = parseInt(verseStr);

            // 根据 bookIndex 找到对应的书卷
            const book = booksData.books.find((b) => b.order === bookIndex);

            // 构建 verseId 用于收藏功能（格式：bookKey-chapter-verse）
            const bookKey = book?.key || 'unknown';
            const fullVerseId = `${bookKey}-${chapter}-${verse}`;

            return {
                ...item,
                bookIndex,
                chapter,
                verse,
                bookName: book?.nameTraditional || '未知',
                bookKey,
                testament: book?.testament || 'unknown',
                fullVerseId, // 用于收藏功能
            };
        });
    }, [rankings]);

    const handleViewChapter = (bookName: string, chapter: number) => {
        router.push(`/?book=${encodeURIComponent(bookName)}&chapter=${chapter}`);
    };

    const handleToggleFavorite = (e: React.MouseEvent, verseId: string) => {
        e.stopPropagation();
        toggleFavorite(verseId);
    };

    // 前3名的图标
    const getMedalIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return null;
    };

    return (
        <div 
            className="space-y-3"
            style={{ 
                contentVisibility: 'auto',
                containIntrinsicSize: '150px'
            }}
        >
            {enrichedRankings.map((item, index) => {
                const rank = index + 1;
                const medal = getMedalIcon(rank);
                const isFav = isFavorite(item.fullVerseId);

                return (
                    <div
                        key={item.verseId}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-bible-200 dark:border-gray-700 hover:border-bible-400 dark:hover:border-bible-600 transition-all shadow-sm hover:shadow-md"
                    >
                        {/* 排名 */}
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            {medal ? (
                                <span className="text-2xl">{medal}</span>
                            ) : (
                                <span className="text-lg font-bold text-bible-600 dark:text-bible-400 font-chinese">{rank}</span>
                            )}
                        </div>

                        {/* 经文信息 */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-bible-900 dark:text-bible-100 font-chinese text-base truncate">
                                {item.bookName} {item.chapter}:{item.verse}
                            </p>
                            {/* 经文内容 - 完整显示 */}
                            {item.text && (
                                <p className="text-xs text-bible-600 dark:text-bible-400 font-chinese mt-1.5 leading-relaxed">
                                    {item.text}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                        item.testament === 'old'
                                            ? 'bg-bible-100 dark:bg-bible-900/30 text-bible-700 dark:text-bible-300'
                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    }`}
                                >
                                    {item.testament === 'old' ? '舊約' : '新約'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current text-gold-600 dark:text-gold-400" />
                                    <span className="text-sm font-semibold text-gold-600 dark:text-gold-400">{item.favorites.toLocaleString()}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">人收藏</span>
                                </div>
                            </div>
                        </div>

                        {/* 操作按钮组 */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            {/* 收藏按钮 */}
                            <button
                                onClick={(e) => handleToggleFavorite(e, item.fullVerseId)}
                                className="p-2 rounded-lg hover:bg-bible-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                                title={isFav ? '取消收藏' : '收藏'}
                                aria-label={isFav ? '取消收藏' : '收藏'}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                <Star
                                    className={`w-5 h-5 transition-colors ${
                                        isFav
                                            ? 'text-gold-500 fill-gold-500 dark:text-gold-400 dark:fill-gold-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                />
                            </button>

                            {/* 查看章节按钮 */}
                            <button
                                onClick={() => handleViewChapter(item.bookName, item.chapter)}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                                title={`查看 ${item.bookName} ${item.chapter}章`}
                                aria-label={`查看 ${item.bookName} ${item.chapter}章`}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                <span className="text-sm font-chinese text-bible-700 dark:text-bible-300 hidden sm:inline">查看章節</span>
                                <ChevronRight className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
