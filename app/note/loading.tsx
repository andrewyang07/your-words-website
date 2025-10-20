export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-6 animate-pulse">
                    <div className="h-10 bg-bible-200 dark:bg-gray-700 rounded-lg w-48 mb-4"></div>
                    <div className="flex gap-2">
                        <div className="h-10 bg-bible-100 dark:bg-gray-700 rounded-lg w-24"></div>
                        <div className="h-10 bg-bible-100 dark:bg-gray-700 rounded-lg w-24"></div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editor Skeleton */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 animate-pulse">
                            <div className="h-96 bg-bible-50 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 animate-pulse">
                            <div className="h-8 bg-bible-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-24 bg-bible-50 dark:bg-gray-700 rounded"></div>
                                <div className="h-24 bg-bible-50 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

