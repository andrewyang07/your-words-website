import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bible-50 to-bible-100 p-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-chinese">
          出错了
        </h2>
        <p className="text-gray-600 mb-6 font-chinese">{message}</p>
        {onRetry && (
          <motion.button
            onClick={onRetry}
            className="px-6 py-3 bg-bible-600 hover:bg-bible-700 text-white rounded-lg font-chinese transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            重试
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

