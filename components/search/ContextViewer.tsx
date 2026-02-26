'use client';

import { X } from 'lucide-react';
import { useSearchStore } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContextViewer() {
  const { contextVerse, setContextVerse, searchLang } = useSearchStore();
  const language = useAppStore((s) => s.language);

  if (!contextVerse) return null;

  const showChinese = searchLang === 'zh';
  const showEnglish = searchLang === 'en';

  return (
    <AnimatePresence>
      {contextVerse && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={() => setContextVerse(null)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] mx-auto max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-bible-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese">
                {contextVerse.bookKey} {contextVerse.chapter}
                {language === 'traditional' ? '章' : '章'}
              </h3>
              <button
                onClick={() => setContextVerse(null)}
                className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5 text-bible-600 dark:text-bible-400" />
              </button>
            </div>

            {/* Verses */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {contextVerse.verses.map((v) => (
                <div
                  key={v.verse}
                  className={`rounded-lg p-3 transition-colors ${
                    v.isCurrent
                      ? 'bg-bible-100 dark:bg-gray-800 border-l-4 border-bible-500 dark:border-bible-400'
                      : 'hover:bg-bible-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="inline-block text-xs font-bold text-bible-500 dark:text-bible-400 mr-2 min-w-[1.5rem]">
                    {v.verse}
                  </span>
                  {showChinese && (
                    <p
                      className={`inline font-chinese leading-relaxed ${
                        v.isCurrent
                          ? 'text-bible-900 dark:text-bible-100 font-medium'
                          : 'text-bible-700 dark:text-bible-300'
                      }`}
                    >
                      {v.textChinese}
                    </p>
                  )}
                  {showEnglish && (
                    <p
                      className={`leading-relaxed ${
                        v.isCurrent
                          ? 'text-bible-900 dark:text-bible-100 font-medium inline'
                          : 'text-bible-700 dark:text-bible-300 inline'
                      }`}
                    >
                      {v.textEnglish}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
