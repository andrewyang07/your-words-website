'use client';

import { motion } from 'framer-motion';
import { Book } from '@/types/verse';

interface ChapterSelectorProps {
  book: Book;
  selectedChapter: number | null;
  onSelectChapter: (chapter: number) => void;
}

export default function ChapterSelector({
  book,
  selectedChapter,
  onSelectChapter,
}: ChapterSelectorProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-bible-900 dark:text-bible-100 mb-4 font-chinese">
        选择章节 - {book.name}
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {chapters.map((chapter, index) => (
          <motion.button
            key={chapter}
            onClick={() => onSelectChapter(chapter)}
            className={`
              aspect-square rounded-lg font-chinese font-bold
              transition-all duration-200
              ${
                selectedChapter === chapter
                  ? 'bg-gold-500 dark:bg-gold-600 text-white shadow-lg scale-110'
                  : 'bg-white dark:bg-gray-800 text-bible-800 dark:text-bible-200 border border-bible-200 dark:border-gray-700 hover:border-gold-400 dark:hover:border-gold-500'
              }
            `}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            whileHover={{ scale: selectedChapter === chapter ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {chapter}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

