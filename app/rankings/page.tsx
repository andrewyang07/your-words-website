'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Languages, HelpCircle, Eye, EyeOff, Menu, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import RankingsList from '@/components/rankings/RankingsList';
import dynamic from 'next/dynamic';

// 动态导入侧边栏
const SideMenu = dynamic(() => import('@/components/navigation/SideMenu'), {
    ssr: false,
});

/**
 * 排行榜页面（客户端渲染）
 * 确保在 Redis 不可用时也能正常显示
 */
export default function RankingsPage() {
    const router = useRouter();
    const { language, theme, setLanguage, toggleTheme } = useAppStore();
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSideMenu, setShowSideMenu] = useState(false);
    const [showAllContent, setShowAllContent] = useState(false);

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
            {/* 顶部导航栏 - 与主页保持一致 */}
            <header
                className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-bible-200 dark:border-gray-700"
                role="banner"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                    {/* 标题行 */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" title="首頁">
                                <Image
                                    src="/logo-light.png"
                                    alt="你的話語 Logo"
                                    width={40}
                                    height={40}
                                    priority
                                    className="w-8 h-8 md:w-10 md:h-10 dark:brightness-90 dark:contrast-125"
                                />
                                <h1
                                    className="text-2xl md:text-3xl font-extrabold font-chinese text-bible-700 dark:text-bible-300 tracking-wide"
                                    style={{
                                        textShadow: '0 0 12px rgba(190,158,93,0.3), 0 0 24px rgba(190,158,93,0.15), 0 1px 2px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    你的話語
                                </h1>
                            </a>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* 帮助按钮 */}
                            <button
                                onClick={() => router.push('/help')}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="显示使用帮助"
                                aria-label="显示使用帮助"
                            >
                                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">帮助</span>
                            </button>

                            {/* 简繁体切换 */}
                            <button
                                onClick={() => setLanguage(language === 'simplified' ? 'traditional' : 'simplified')}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={language === 'simplified' ? '切换到繁体' : '切換到簡體'}
                                aria-label={language === 'simplified' ? '切换到繁体中文' : '切換到簡體中文'}
                            >
                                <Languages className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                                    {language === 'simplified' ? '繁' : '簡'}
                                </span>
                            </button>

                            {/* 阅读/背诵模式切换 */}
                            <button
                                onClick={() => setShowAllContent(!showAllContent)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={showAllContent ? '切换到背诵模式' : '切换到阅读模式'}
                                aria-label={showAllContent ? '切换到背诵模式' : '切换到阅读模式'}
                                aria-pressed={showAllContent}
                            >
                                {showAllContent ? (
                                    <>
                                        <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                        <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">背诵</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                        <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">阅读</span>
                                    </>
                                )}
                            </button>

                            {/* 汉堡菜单按钮 */}
                            <button
                                onClick={() => setShowSideMenu(true)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="菜单"
                                aria-label="打开菜单"
                            >
                                <Menu className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">菜單</span>
                            </button>
                        </div>
                    </div>

                    {/* 副标题 - 显示当前页面 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-1 text-sm text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200 transition-colors font-chinese"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>返回主頁</span>
                        </button>
                        <span className="text-bible-400 dark:text-gray-600">/</span>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                            <span className="text-sm font-semibold text-bible-800 dark:text-bible-200 font-chinese">總排行榜</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 侧边栏菜单 */}
            <SideMenu isOpen={showSideMenu} onClose={() => setShowSideMenu(false)} theme={theme} onThemeChange={toggleTheme} />

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
