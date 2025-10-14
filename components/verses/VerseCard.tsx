'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Verse } from '@/types/verse';
import { CardSize } from '@/types/common';
import { Star, BookOpen } from 'lucide-react';

interface VerseCardProps {
  verse: Verse;
  size?: CardSize;
  onViewInBible?: () => void;
}

export default function VerseCard({
  verse,
  size = 'medium',
  onViewInBible,
}: VerseCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

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
      // TODO: 跳转到圣经阅读界面
      console.log('查看原文:', verse);
    }
  };

  // 显示预览文本或完整文本
  const displayText = isRevealed
    ? verse.text
    : verse.text.slice(0, previewLength) + '...';

  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        bg-white rounded-xl shadow-md
        hover:shadow-xl hover:-translate-y-1
        cursor-pointer transition-all duration-300
        border-2
        ${isRevealed ? 'border-gold-400' : 'border-bible-200'}
        flex flex-col justify-between
        relative
      `}
      onClick={handleCardClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 翻转提示 */}
      {!isRevealed && (
        <div className="absolute top-2 right-2">
          <motion.div
            className="w-6 h-6 rounded-full bg-bible-100 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs text-bible-600">?</span>
          </motion.div>
        </div>
      )}

      {/* 经文引用 */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-bible-600 font-medium font-chinese text-sm">
          {verse.book} {verse.chapter}:{verse.verse}
        </span>
        {verse.priority && verse.priority >= 4 && (
          <Star className="w-4 h-4 text-gold-500 fill-gold-300" />
        )}
      </div>

      {/* 经文内容 - 带翻转动画 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={isRevealed ? 'revealed' : 'hidden'}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.3 }}
          className={`
            ${textSizes[size]}
            text-bible-800 leading-relaxed font-chinese
            ${isRevealed ? '' : 'line-clamp-4'}
            flex-1
          `}
        >
          {displayText}
        </motion.p>
      </AnimatePresence>

      {/* 底部信息栏 */}
      <div className="mt-3 pt-2 border-t border-bible-100 flex items-center justify-between">
        <span className="text-xs text-bible-500 font-chinese">
          {verse.testament === 'old' ? '旧约' : '新约'}
        </span>

        {/* 查看原文按钮 */}
        <button
          onClick={handleViewInBible}
          className="flex items-center gap-1 px-2 py-1 text-xs text-bible-600 hover:text-bible-800 hover:bg-bible-50 rounded transition-colors"
          title="在圣经中查看"
        >
          <BookOpen className="w-3 h-3" />
          <span className="font-chinese">原文</span>
        </button>
      </div>

      {/* 状态指示 */}
      {isRevealed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-white text-xs font-bold">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

