import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border dark:border-gray-700 animate-fade-in">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500 dark:text-red-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-chinese">出错了</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 font-chinese">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-6 py-3 bg-bible-600 dark:bg-bible-500 hover:bg-bible-700 dark:hover:bg-bible-600 text-white rounded-lg font-chinese transition-all hover:scale-105 active:scale-95"
                    >
                        重试
                    </button>
                )}
            </div>
        </div>
    );
}
