'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { Verse } from '@/types/verse';
import VerseCard from './VerseCard';
import { getCardSize } from '@/lib/utils';

interface MasonryLayoutProps {
    verses: Verse[];
    onViewInBible?: (verse: Verse) => void;
    defaultRevealed?: boolean; // 是否默认展开所有卡片
}

export default function MasonryLayout({ verses, onViewInBible, defaultRevealed = false }: MasonryLayoutProps) {
    // 根据屏幕大小动态调整列数
    const getInitialColumnCount = () => {
        if (typeof window === 'undefined') return 4; // SSR 时默认4列
        const width = window.innerWidth;
        if (width < 768) return 1;
        if (width < 1024) return 2;
        if (width < 1280) return 3;
        return 4;
    };

    const [columnCount, setColumnCount] = useState(getInitialColumnCount);

    useEffect(() => {
        const updateColumnCount = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setColumnCount(1); // 手机端
            } else if (width < 1024) {
                setColumnCount(2); // 平板端
            } else if (width < 1280) {
                setColumnCount(3); // 小桌面
            } else {
                setColumnCount(4); // 大桌面
            }
        };

        // 立即执行一次
        updateColumnCount();

        window.addEventListener('resize', updateColumnCount);
        return () => window.removeEventListener('resize', updateColumnCount);
    }, []);

    // 计算瀑布流布局，同时记录每张卡片的原始索引
    const masonryColumns = useMemo(() => {
        const columns: Array<Array<{ verse: Verse; originalIndex: number }>> = Array.from({ length: columnCount }, () => []);
        const columnHeights = Array(columnCount).fill(0);

        verses.forEach((verse, originalIndex) => {
            // 找到最短的列
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

            // 根据优先级和文本长度确定卡片高度
            const size = getCardSize(verse);
            const heights = { small: 120, medium: 160, large: 200 };
            const cardHeight = heights[size];

            columns[shortestColumnIndex].push({ verse, originalIndex });
            columnHeights[shortestColumnIndex] += cardHeight;
        });

        return columns;
    }, [verses, columnCount]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {masonryColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-4">
                    {column.map(({ verse, originalIndex }, indexInColumn) => (
                        <motion.div
                            key={verse.id}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                duration: 0.5,
                                delay: originalIndex * 0.02,
                                ease: [0.4, 0, 0.2, 1], // cubic-bezier 优雅缓动
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
