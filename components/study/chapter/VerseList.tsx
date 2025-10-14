'use client';

import { motion } from 'framer-motion';
import { Verse } from '@/types/verse';

interface VerseListProps {
  verses: Verse[];
  book: string;
  chapter: number;
}

export default function VerseList({ verses, book, chapter }: VerseListProps) {
  if (verses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-bible-600 dark:text-bible-400 font-chinese">
          暂无经文数据
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.h3
        className="text-xl font-bold text-bible-900 dark:text-bible-100 mb-6 font-chinese"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {book} {chapter}
      </motion.h3>

      <div className="space-y-4">
        {verses.map((verse, index) => (
          <motion.div
            key={verse.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-bible-200 dark:border-gray-700 hover:border-bible-400 dark:hover:border-bible-500 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 5 }}
          >
            <div className="flex items-start gap-4">
              {/* 经文编号 */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bible-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-bold text-bible-700 dark:text-bible-300">
                  {verse.verse}
                </span>
              </div>

              {/* 经文内容 */}
              <div className="flex-1">
                <p className="text-base leading-relaxed text-bible-900 dark:text-bible-100 font-chinese">
                  {verse.text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

