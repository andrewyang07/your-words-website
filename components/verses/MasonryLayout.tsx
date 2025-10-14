'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Verse } from '@/types/verse';
import VerseCard from './VerseCard';
import { getCardSize } from '@/lib/utils';

interface MasonryLayoutProps {
  verses: Verse[];
  onViewInBible?: (verse: Verse) => void;
  defaultRevealed?: boolean; // 是否默认展开所有卡片
}

export default function MasonryLayout({
  verses,
  onViewInBible,
  defaultRevealed = false,
}: MasonryLayoutProps) {
  // 计算瀑布流布局，同时记录每张卡片的原始索引
  const masonryColumns = useMemo(() => {
    const columnCount = 4;
    const columns: Array<Array<{ verse: Verse; originalIndex: number }>> = Array.from(
      { length: columnCount },
      () => []
    );
    const columnHeights = Array(columnCount).fill(0);

    verses.forEach((verse, originalIndex) => {
      // 找到最短的列
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      );

      // 根据优先级和文本长度确定卡片高度
      const size = getCardSize(verse);
      const heights = { small: 120, medium: 160, large: 200 };
      const cardHeight = heights[size];

      columns[shortestColumnIndex].push({ verse, originalIndex });
      columnHeights[shortestColumnIndex] += cardHeight;
    });

    return columns;
  }, [verses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
      {masonryColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map(({ verse, originalIndex }) => (
            <motion.div
              key={verse.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: originalIndex * 0.03,
                ease: 'easeOut',
              }}
            >
              <VerseCard
                verse={verse}
                size={getCardSize(verse)}
                onViewInBible={() => onViewInBible?.(verse)}
                defaultRevealed={defaultRevealed}
              />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

