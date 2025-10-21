export default function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800">
            <div className="flex flex-col items-center animate-fade-in">
                <div className="w-16 h-16 border-4 border-bible-200 dark:border-gray-700 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
                <p className="mt-4 text-bible-700 dark:text-bible-300 font-chinese">加载中...</p>
            </div>
        </div>
    );
}
