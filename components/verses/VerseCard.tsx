'use client';

import { motion } from 'framer-motion';
import { Verse } from '@/types/verse';
import { CardSize } from '@/types/common';
import { Star } from 'lucide-react';

interface VerseCardProps {
  verse: Verse;
  size?: CardSize;
  onClick: () => void;
}

export default function VerseCard({
  verse,
  size = 'medium',
  onClick,
}: VerseCardProps) {
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

  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        bg-white rounded-xl shadow-md
        hover:shadow-xl hover:-translate-y-1
        cursor-pointer transition-all duration-300
        border border-bible-200
        flex flex-col justify-between
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 经文引用 */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-bible-600 font-medium font-chinese text-sm">
          {verse.book} {verse.chapter}:{verse.verse}
        </span>
        {verse.priority && verse.priority >= 4 && (
          <Star className="w-4 h-4 text-gold-500 fill-gold-300" />
        )}
      </div>

      {/* 经文内容 */}
      <p
        className={`
          ${textSizes[size]}
          text-bible-800 leading-relaxed font-chinese
          line-clamp-4 flex-1
        `}
      >
        {verse.text}
      </p>

      {/* 约别标签 */}
      <div className="mt-3 pt-2 border-t border-bible-100">
        <span className="text-xs text-bible-500 font-chinese">
          {verse.testament === 'old' ? '旧约' : '新约'}
        </span>
      </div>
    </motion.div>
  );
}

