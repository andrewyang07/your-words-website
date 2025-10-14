'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Verse } from '@/types/verse';
import VerseCard from './VerseCard';
import { getCardSize } from '@/lib/utils';

interface MasonryLayoutProps {
  verses: Verse[];
  onViewInBible?: (verse: Verse) => void;
}

export default function MasonryLayout({
  verses,
  onViewInBible,
}: MasonryLayoutProps) {
  // 计算瀑布流布局
  const masonryColumns = useMemo(() => {
    const columnCount = 4;
    const columns: Verse[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array(columnCount).fill(0);

    verses.forEach((verse) => {
      // 找到最短的列
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      );

      // 根据优先级和文本长度确定卡片高度
      const size = getCardSize(verse);
      const heights = { small: 120, medium: 160, large: 200 };
      const cardHeight = heights[size];

      columns[shortestColumnIndex].push(verse);
      columnHeights[shortestColumnIndex] += cardHeight;
    });

    return columns;
  }, [verses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
      {masonryColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((verse, index) => (
            <motion.div
              key={verse.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: (columnIndex * column.length + index) * 0.05,
              }}
            >
              <VerseCard
                verse={verse}
                size={getCardSize(verse)}
                onViewInBible={() => onViewInBible?.(verse)}
              />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

