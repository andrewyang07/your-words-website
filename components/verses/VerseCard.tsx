'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Verse } from '@/types/verse';
import { CardSize } from '@/types/common';
import { Star, BookOpen } from 'lucide-react';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useMaskStore } from '@/stores/useMaskStore';
import { maskVerseText } from '@/lib/utils';
import { getVerseNumericId, sendStats } from '@/lib/statsUtils';

interface VerseCardProps {
    verse: Verse;
    size?: CardSize;
    onViewInBible?: () => void;
    defaultRevealed?: boolean; // 是否默认展开
}

export default function VerseCard({ verse, size = 'medium', onViewInBible, defaultRevealed = false }: VerseCardProps) {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { maskMode, maskCharsType, maskCharsFixed, maskCharsMin, maskCharsMax } = useMaskStore();
    const [isRevealed, setIsRevealed] = useState(defaultRevealed);
    const isFav = isFavorite(verse.id);

    // 当 defaultRevealed 改变时，更新 isRevealed
    useEffect(() => {
        setIsRevealed(defaultRevealed);
    }, [defaultRevealed]);

    // 计算遮罩字符数（固定或随机范围）
    const visibleChars = useMemo(() => {
        if (maskCharsType === 'fixed') {
            return maskCharsFixed;
        }
        // 范围模式：为每张卡片生成随机数（基于 verse.id 保证稳定）
        const seed = verse.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = Math.abs(Math.sin(seed)) * (maskCharsMax - maskCharsMin + 1);
        return Math.floor(random) + maskCharsMin;
    }, [verse.id, maskCharsType, maskCharsFixed, maskCharsMin, maskCharsMax]);

    const sizeClasses = {
        small: 'p-4 min-h-[120px]',
        medium: 'p-6 min-h-[160px]',
        large: 'p-8 min-h-[200px]',
    };

    // 统一字体大小，提升易读性
    const textSizes = {
        small: 'text-base',
        medium: 'text-base',
        large: 'text-base',
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // 如果点击的是按钮，不翻转卡片
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        setIsRevealed(!isRevealed);
    };

    // 键盘导航支持
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsRevealed(!isRevealed);
        }
    };

    const handleViewInBible = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onViewInBible) {
            onViewInBible();
        } else {
            // 跳转到逐节背诵页面，并传递书卷和章节信息
            router.push(`/study/chapter?book=${encodeURIComponent(verse.book)}&chapter=${verse.chapter}`);
        }
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        const wasFavorite = isFav;
        toggleFavorite(verse.id);

        // 只统计"收藏"动作，不统计"取消收藏"
        if (!wasFavorite) {
            const verseId = getVerseNumericId(verse);
            sendStats('favorite', verseId);
        }
    };

    // 显示预览文本或完整文本
    const displayText = isRevealed ? verse.text : maskVerseText(verse.text, maskMode, visibleChars);

    return (
        <div
            className={`
        ${sizeClasses[size]}
        bg-white dark:bg-gray-800 rounded-xl shadow-md
        cursor-pointer
        border-2 border-bible-200 dark:border-gray-700
        [@media(hover:hover)]:hover:border-bible-500 [@media(hover:hover)]:dark:hover:border-bible-400
        [@media(hover:hover)]:hover:shadow-[0_0_0_2px_rgba(190,158,93,0.3)]
        flex flex-col justify-between
        relative
        touch-manipulation
        transition-all duration-200
        active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-bible-500 dark:focus:ring-bible-400
      `}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            role="article"
            aria-label={`${verse.book} ${verse.chapter}章${verse.verse}节，${isRevealed ? '已展开' : '已收起'}，按Enter或空格键切换`}
            aria-pressed={isRevealed}
            tabIndex={0}
        >
            {/* 经文引用 */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <span className="text-bible-600 dark:text-bible-400 font-medium font-chinese text-sm">
                        {verse.book} {verse.chapter}:{verse.verse}
                    </span>
                </div>
                {/* 收藏星标 */}
                <button
                    onClick={handleToggleFavorite}
                    className="transition-transform hover:scale-110 p-2 -m-2 touch-manipulation"
                    title={isFav ? '取消收藏' : '收藏'}
                    aria-label={
                        isFav ? `取消收藏 ${verse.book} ${verse.chapter}:${verse.verse}` : `收藏 ${verse.book} ${verse.chapter}:${verse.verse}`
                    }
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <Star
                        className={`w-5 h-5 transition-colors ${
                            isFav ? 'text-gold-500 fill-gold-500 dark:text-gold-400 dark:fill-gold-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                </button>
            </div>

            {/* 经文内容 */}
            <p
                className={`
            ${textSizes[size]}
            text-gray-800 dark:text-gray-100 font-medium leading-relaxed font-chinese
            flex-1
            transition-opacity duration-200
            break-words overflow-wrap-anywhere
          `}
            >
                {displayText}
            </p>

            {/* 底部信息栏 */}
            <div className="mt-3 pt-2 border-t border-bible-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-bible-500 dark:text-gray-400 font-chinese">{verse.testament === 'old' ? '旧约' : '新约'}</span>

                {/* 查看整章按钮 */}
                <button
                    onClick={handleViewInBible}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-bible-600 dark:text-bible-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-bible-50 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] justify-center"
                    title="查看本章所有经文"
                    aria-label={`查看 ${verse.book} 第${verse.chapter}章所有经文`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <BookOpen className="w-3 h-3" />
                    <span className="font-chinese">查看整章</span>
                </button>
            </div>
        </div>
    );
}
