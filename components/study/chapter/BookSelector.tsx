'use client';

import { motion } from 'framer-motion';
import { Book } from '@/types/verse';

interface BookSelectorProps {
  books: Book[];
  selectedBook: Book | null;
  onSelectBook: (book: Book) => void;
}

export default function BookSelector({
  books,
  selectedBook,
  onSelectBook,
}: BookSelectorProps) {
  // 按旧约/新约分组
  const oldTestamentBooks = books.filter((b) => b.testament === 'old');
  const newTestamentBooks = books.filter((b) => b.testament === 'new');

  const renderBookGroup = (groupBooks: Book[], title: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-bible-900 dark:text-bible-100 mb-4 font-chinese">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {groupBooks.map((book, index) => (
          <motion.button
            key={book.id}
            onClick={() => onSelectBook(book)}
            className={`
              p-4 rounded-lg font-chinese text-sm
              transition-all duration-200
              ${
                selectedBook?.id === book.id
                  ? 'bg-bible-600 dark:bg-bible-500 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-bible-800 dark:text-bible-200 border border-bible-200 dark:border-gray-700 hover:border-bible-400 dark:hover:border-bible-500'
              }
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ scale: selectedBook?.id === book.id ? 1.05 : 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="font-bold mb-1">{book.name}</div>
            <div className="text-xs opacity-70">
              {book.chapters} 章
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {renderBookGroup(oldTestamentBooks, '旧约 Old Testament')}
      {renderBookGroup(newTestamentBooks, '新约 New Testament')}
    </div>
  );
}

