'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Languages, HelpCircle, Eye, EyeOff, Filter, ChevronDown, Check } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import { useAppStore } from '@/stores/useAppStore';
import RankingsList from '@/components/rankings/RankingsList';
import PageHeader from '@/components/layout/PageHeader';
import booksData from '@/public/data/books.json';
import dynamic from 'next/dynamic';

// 动态导入侧边栏
const SideMenu = dynamic(() => import('@/components/navigation/SideMenu'), {
    ssr: false,
});

/**
 * 排行榜页面（客户端渲染）
 * 确保在 Redis 不可用时也能正常显示
 */
type BookFilterType = 'all' | 'old' | 'new' | string;

export default function RankingsPage() {
    const router = useRouter();
    const { language, theme, setLanguage, setTheme } = useAppStore();
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSideMenu, setShowSideMenu] = useState(false);
    const [showAllContent, setShowAllContent] = useState(false);
    const [bookFilter, setBookFilter] = useState<BookFilterType>('all');

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
    
    // 筛选排行榜
    const filteredRankings = useMemo(() => {
        if (bookFilter === 'all') return rankings;
        
        return rankings.filter((item: any) => {
            const [bookIndexStr] = item.verseId.split('-');
            const bookIndex = parseInt(bookIndexStr);
            const book = booksData.books.find(b => b.order === bookIndex);
            
            if (bookFilter === 'old') return book?.testament === 'old';
            if (bookFilter === 'new') return book?.testament === 'new';
            return book?.key === bookFilter;
        });
    }, [rankings, bookFilter]);
    
    // 计算筛选选项的经文数量
    const rankingsBookCounts = useMemo(() => {
        const counts = {
            all: rankings.length,
            old: 0,
            new: 0,
            books: {} as Record<string, number>
        };
        
        rankings.forEach((item: any) => {
            const [bookIndexStr] = item.verseId.split('-');
            const bookIndex = parseInt(bookIndexStr);
            const book = booksData.books.find(b => b.order === bookIndex);
            if (book) {
                if (book.testament === 'old') counts.old++;
                if (book.testament === 'new') counts.new++;
                counts.books[book.key] = (counts.books[book.key] || 0) + 1;
            }
        });
        
        return counts;
    }, [rankings]);

    return (
        <div className="min-h-screen yw-page">
            <PageHeader
                onMenuClick={() => setShowSideMenu(true)}
                showHelp={false}
                subtitle={<span className="rounded-full border border-stone-900/10 px-2.5 py-1 text-xs text-stone-500 dark:border-white/10 dark:text-stone-400">總排行榜</span>}
                rightContent={
                    <>
                        <button
                            onClick={() => router.push('/help')}
                            className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            title="显示使用帮助"
                            aria-label="显示使用帮助"
                        >
                            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline font-chinese text-sm">帮助</span>
                        </button>
                        <button
                            onClick={() => setLanguage(language === 'simplified' ? 'traditional' : 'simplified')}
                            className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            title={language === 'simplified' ? '切换到繁体' : '切換到簡體'}
                            aria-label={language === 'simplified' ? '切换到繁体中文' : '切換到簡體中文'}
                        >
                            <Languages className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline font-chinese text-sm">
                                {language === 'simplified' ? '繁' : '簡'}
                            </span>
                        </button>
                        <button
                            onClick={() => setShowAllContent(!showAllContent)}
                            className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            title={showAllContent ? '切换到背诵模式' : '切换到阅读模式'}
                            aria-label={showAllContent ? '切换到背诵模式' : '切换到阅读模式'}
                            aria-pressed={showAllContent}
                        >
                            {showAllContent ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                            <span className="hidden sm:inline font-chinese text-sm">{showAllContent ? '背诵' : '阅读'}</span>
                        </button>
                    </>
                }
            />

            {/* 侧边栏菜单 */}
            <SideMenu 
                isOpen={showSideMenu} 
                onClose={() => setShowSideMenu(false)} 
                theme={theme} 
                onThemeChange={setTheme}
                language={language}
                onLanguageChange={setLanguage}
            />

            {/* 主内容 */}
            <main className="yw-shell">
                {/* 说明文字 */}
                <div className="mb-6 yw-panel p-4">
                    <p className="text-sm text-stone-700 dark:text-stone-300 font-chinese text-center">
                        📊 最多收藏的聖經經文（按收藏次數排序） · 每小時更新
                    </p>
                </div>
                
                {/* 筛选工具栏 */}
                {rankings.length > 0 && !loading && !error && (
                    <div className="relative z-[200] mb-6 flex items-center justify-between flex-wrap gap-3 overflow-visible">
                        <span className="text-sm text-stone-500 dark:text-stone-400 font-chinese">
                            共 <span className="font-semibold text-stone-700 dark:text-stone-300">{filteredRankings.length}</span> 节
                        </span>
                        
                        {/* 筛选按钮 */}
                        <Listbox value={bookFilter} onChange={setBookFilter}>
                            <div className="relative z-[220] overflow-visible">
                                <Listbox.Button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bible-50 dark:bg-gray-800 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors">
                                    <Filter className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                                    <span className="text-xs text-stone-700 dark:text-stone-300 font-chinese">篩選</span>
                                    <ChevronDown className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                                </Listbox.Button>
                                <Transition
                                    enter="transition duration-100 ease-out"
                                    enterFrom="transform scale-95 opacity-0"
                                    enterTo="transform scale-100 opacity-100"
                                    leave="transition duration-75 ease-out"
                                    leaveFrom="transform scale-100 opacity-100"
                                    leaveTo="transform scale-95 opacity-0"
                                >
                                    <Listbox.Options className="absolute right-0 z-[9999] mt-2 w-64 max-h-[min(24rem,60vh)] overflow-y-auto rounded-2xl border border-stone-900/10 bg-white py-1 shadow-[0_24px_70px_rgba(68,64,60,0.24)] dark:border-white/10 dark:bg-gray-950 scrollbar-thin">
                                        {/* 全部 / 旧约 / 新约 */}
                                        <Listbox.Option value="all">
                                            {({ active, selected }) => (
                                                <div className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-chinese text-stone-950 dark:text-stone-50">
                                                            全部
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                ({rankingsBookCounts.all})
                                                            </span>
                                                            {selected && <Check className="w-4 h-4 text-stone-600 dark:text-stone-400" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Listbox.Option>

                                        <Listbox.Option value="old">
                                            {({ active, selected }) => (
                                                <div className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-chinese text-stone-950 dark:text-stone-50">
                                                            舊約
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                ({rankingsBookCounts.old})
                                                            </span>
                                                            {selected && <Check className="w-4 h-4 text-stone-600 dark:text-stone-400" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Listbox.Option>
                                        
                                        <Listbox.Option value="new">
                                            {({ active, selected }) => (
                                                <div className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-chinese text-stone-950 dark:text-stone-50">
                                                            新約
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                ({rankingsBookCounts.new})
                                                            </span>
                                                            {selected && <Check className="w-4 h-4 text-stone-600 dark:text-stone-400" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Listbox.Option>

                                        {/* 分隔线 */}
                                        <div className="border-t border-bible-200 dark:border-gray-700 my-1" />

                                        {/* 各书卷 */}
                                        {booksData.books.map((book) => {
                                            const count = rankingsBookCounts.books[book.key] || 0;
                                            if (count === 0) return null;

                                            return (
                                                <Listbox.Option key={book.key} value={book.key}>
                                                    {({ active, selected }) => (
                                                        <div className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-chinese text-stone-950 dark:text-stone-50">
                                                                    {book.nameTraditional}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        ({count})
                                                                    </span>
                                                                    {selected && <Check className="w-4 h-4 text-stone-600 dark:text-stone-400" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Listbox.Option>
                                            );
                                        })}
                                    </Listbox.Options>
                                </Transition>
                            </div>
                        </Listbox>
                    </div>
                )}

                {/* 加载状态 */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
                        <p className="mt-4 text-stone-600 dark:text-stone-400 font-chinese">加載排行榜中...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-stone-600 dark:text-stone-400 font-chinese mb-4">{error}</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors font-chinese"
                        >
                            返回主頁
                        </Link>
                    </div>
                ) : filteredRankings.length > 0 ? (
                    <RankingsList rankings={filteredRankings} />
                ) : rankings.length > 0 ? (
                    <div className="text-center py-12">
                        <p className="text-stone-500 dark:text-stone-400 font-chinese mb-2">該篩選條件下沒有經文</p>
                        <button
                            onClick={() => setBookFilter('all')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors font-chinese"
                        >
                            查看全部
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-stone-500 dark:text-stone-400 font-chinese mb-2">暫無排行榜數據</p>
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
