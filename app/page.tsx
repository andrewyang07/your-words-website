'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { Book, Layers } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { language, setLanguage, setCurrentMode } = useAppStore();

  const handlePresetMode = () => {
    setCurrentMode('preset');
    router.push('/study/preset');
  };

  const handleChapterMode = () => {
    setCurrentMode('chapter');
    router.push('/study/chapter');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'simplified' ? 'traditional' : 'simplified');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bible-50 via-bible-100 to-gold-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl w-full"
      >
        {/* Logo和标题 */}
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-bible-900 dark:text-bible-100 mb-4 font-chinese"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          Your Words
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-bible-700 dark:text-bible-300 mb-12 font-chinese"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          让神的话语常在心中
        </motion.p>

        {/* 模式选择按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          <motion.button
            onClick={handlePresetMode}
            className="group relative p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-transparent dark:border-gray-700"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-bible-600 dark:text-bible-400" />
            <h3 className="text-xl md:text-2xl font-bold text-bible-900 dark:text-bible-100 mb-2 font-chinese">
              精选经文
            </h3>
            <p className="text-sm md:text-base text-bible-600 dark:text-bible-400 font-chinese">
              100节最值得背诵的经文
            </p>
          </motion.button>

          <motion.button
            onClick={handleChapterMode}
            className="group relative p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-transparent dark:border-gray-700"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Book className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-bible-600 dark:text-bible-400" />
            <h3 className="text-xl md:text-2xl font-bold text-bible-900 dark:text-bible-100 mb-2 font-chinese">
              逐节背诵
            </h3>
            <p className="text-sm md:text-base text-bible-600 dark:text-bible-400 font-chinese">按书卷章节系统背诵</p>
          </motion.button>
        </div>

        {/* 语言切换 */}
        <motion.button
          onClick={toggleLanguage}
          className="px-6 py-3 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-full text-bible-800 dark:text-bible-200 font-chinese transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {language === 'simplified' ? '简体' : '繁體'} | 切换语言
        </motion.button>
      </motion.div>
    </div>
  );
}

