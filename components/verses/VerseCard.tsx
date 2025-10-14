'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Verse } from '@/types/verse';
import { CardSize } from '@/types/common';
import { Star, BookOpen } from 'lucide-react';
import { useFavoritesStore } from '@/stores/useFavoritesStore';

interface VerseCardProps {
  verse: Verse;
  size?: CardSize;
  onViewInBible?: () => void;
  defaultRevealed?: boolean; // 是否默认展开
}

export default function VerseCard({
  verse,
  size = 'medium',
  onViewInBible,
  defaultRevealed = false,
}: VerseCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const [isRevealed, setIsRevealed] = useState(defaultRevealed);
  const isFav = isFavorite(verse.id);

  // 当 defaultRevealed 改变时，更新 isRevealed
  useEffect(() => {
    setIsRevealed(defaultRevealed);
  }, [defaultRevealed]);

  // 每张卡片随机显示 3-7 个字
  const previewLength = useMemo(() => {
    return Math.floor(Math.random() * 5) + 3; // 3-7
  }, [verse.id]);

  const sizeClasses = {
    small: 'p-4 min-h-[120px]',
    medium: 'p-6 min-h-[160px]',
    large: 'p-8 min-h-[200px]',
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不翻转卡片
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsRevealed(!isRevealed);
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
    toggleFavorite(verse.id);
  };

  // 显示预览文本或完整文本
  const displayText = isRevealed
    ? verse.text
    : verse.text.slice(0, previewLength) + '...';

  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        bg-white dark:bg-gray-800 rounded-xl shadow-md
        hover:shadow-xl hover:-translate-y-1
        cursor-pointer transition-all duration-300
        border border-bible-200 dark:border-gray-700
        flex flex-col justify-between
        relative
      `}
      onClick={handleCardClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 经文引用 */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-bible-600 dark:text-bible-400 font-medium font-chinese text-sm">
          {verse.book} {verse.chapter}:{verse.verse}
        </span>
        {/* 收藏星标 */}
        <button
          onClick={handleToggleFavorite}
          className="transition-transform hover:scale-110"
          title={isFav ? '取消收藏' : '收藏'}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFav
                ? 'text-gold-500 fill-gold-500 dark:text-gold-400 dark:fill-gold-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      </div>

      {/* 经文内容 - 带展开动画 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={isRevealed ? 'revealed' : 'hidden'}
          initial={{ opacity: 0, height: 'auto' }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`
            ${textSizes[size]}
            text-bible-800 dark:text-bible-200 leading-relaxed font-chinese
            ${isRevealed ? '' : 'line-clamp-4'}
            flex-1
          `}
        >
          {displayText}
        </motion.p>
      </AnimatePresence>

      {/* 底部信息栏 */}
      <div className="mt-3 pt-2 border-t border-bible-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-bible-500 dark:text-gray-400 font-chinese">
          {verse.testament === 'old' ? '旧约' : '新约'}
        </span>

        {/* 查看原文按钮 */}
        <button
          onClick={handleViewInBible}
          className="flex items-center gap-1 px-2 py-1 text-xs text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200 hover:bg-bible-50 dark:hover:bg-gray-700 rounded transition-colors"
          title="在圣经中查看"
        >
          <BookOpen className="w-3 h-3" />
          <span className="font-chinese">原文</span>
        </button>
      </div>

    </motion.div>
  );
}

