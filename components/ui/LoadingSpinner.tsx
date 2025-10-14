import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-bible-200 dark:border-gray-700"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-bible-600 dark:border-t-bible-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="mt-4 text-bible-700 dark:text-bible-300 font-chinese">加载中...</p>
      </motion.div>
    </div>
  );
}

