'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import RankingsList from '@/components/rankings/RankingsList';

/**
 * 排行榜页面（客户端渲染）
 * 确保在 Redis 不可用时也能正常显示
 */
export default function RankingsPage() {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 客户端获取排行榜数据
    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const response = await fetch('/api/rankings');
                if (response.ok) {
                    const data = await response.json();
                    setRankings(data.rankings || []);
                } else {
                    setError('加載失敗，請稍後重試');
                }
            } catch (err) {
                console.error('Failed to fetch rankings:', err);
                setError('網絡連接失敗');
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-bible-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-800 transition-colors"
                            title="返回主页"
                        >
                            <ArrowLeft className="w-5 h-5 text-bible-600 dark:text-bible-400" />
                            <span className="text-sm font-chinese text-bible-700 dark:text-bible-300">返回主頁</span>
                        </Link>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                            <h1 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">總排行榜</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* 主内容 */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* 说明文字 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gold-200 dark:border-gold-700/30">
                    <p className="text-sm text-bible-700 dark:text-bible-300 font-chinese text-center">
                        📊 最多收藏的聖經經文（按收藏次數排序） · 每小時更新
                    </p>
                </div>

                {/* 加载状态 */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
                        <p className="mt-4 text-bible-600 dark:text-bible-400 font-chinese">加載排行榜中...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-bible-600 dark:text-bible-400 font-chinese mb-4">{error}</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors font-chinese"
                        >
                            返回主頁
                        </Link>
                    </div>
                ) : rankings.length > 0 ? (
                    <RankingsList rankings={rankings} />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-bible-500 dark:text-bible-400 font-chinese mb-2">暫無排行榜數據</p>
                        <p className="text-sm text-bible-400 dark:text-bible-500 font-chinese">開始收藏經文吧！</p>
                    </div>
                )}
            </main>

            {/* 页脚 */}
            <footer className="border-t border-bible-200 dark:border-gray-700 mt-12">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 font-chinese">
                    <p>願神的話語常在你心中 🙏</p>
                    <p className="mt-2 text-xs">© 2025 你的話語 · Made with ❤️ for Christ</p>
                </div>
            </footer>
        </div>
    );
}
