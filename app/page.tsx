'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter,
    Shuffle,
    Star,
    X,
    Eye,
    EyeOff,
    Sun,
    Moon,
    Monitor,
    Languages,
    HelpCircle,
    RotateCcw,
    ChevronDown,
    Check,
    Share2,
} from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import Image from 'next/image';
import { useVerseStore } from '@/stores/useVerseStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Verse, Book } from '@/types/verse';
import { encodeVerseList, decodeVerseList } from '@/lib/bibleBookMapping';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MasonryLayout from '@/components/verses/MasonryLayout';

type FilterType = 'all' | 'old' | 'new' | 'favorites';

export default function HomePage() {
    const { language, theme, setLanguage, toggleTheme } = useAppStore();
    const { verses, books, loadVerses, loadBooks } = useVerseStore();
    const { isFavorite, addFavorites, getFavoritesList } = useFavoritesStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 筛选状态
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [shuffleKey, setShuffleKey] = useState(0);
    const [showAllContent, setShowAllContent] = useState(false);

    // 章节模式的经文
    const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
    const [loadingChapter, setLoadingChapter] = useState(false);

    // 是否是初次加载（用于控制动画）
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 是否显示引导提示（从 localStorage 读取）
    const [showGuide, setShowGuide] = useState(true);
    const [showGuideHint, setShowGuideHint] = useState(false); // 关闭提示

    // 分享功能相关状态
    const [sharedVerses, setSharedVerses] = useState<Array<{ bookKey: string; chapter: number; verse: number }>>([]);
    const [sharedVersesData, setSharedVersesData] = useState<Verse[]>([]); // 分享经文的完整数据
    const [showShareBanner, setShowShareBanner] = useState(false);
    const [shareToast, setShareToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    // 从 localStorage 读取引导卡片状态
    useEffect(() => {
        const guideDismissed = localStorage.getItem('guide-dismissed');
        if (guideDismissed === 'true') {
            setShowGuide(false);
        }
    }, []);

    // 关闭引导卡片
    const handleCloseGuide = () => {
        setShowGuide(false);
        localStorage.setItem('guide-dismissed', 'true');
        // 显示提示，3秒后消失
        setShowGuideHint(true);
    };

    // 清理提示toast的timer
    useEffect(() => {
        if (showGuideHint) {
            const timer = setTimeout(() => setShowGuideHint(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showGuideHint]);

    // 打开引导卡片
    const handleOpenGuide = () => {
        setShowGuide(true);
    };

    // 同步主题到 DOM
    useEffect(() => {
        const updateTheme = () => {
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        updateTheme();

        // 监听系统主题变化
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => updateTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // 加载初始数据
    useEffect(() => {
        Promise.all([loadVerses('preset', language), loadBooks(language)])
            .then(() => {
                setLoading(false);
                // 初次加载完成后，标记为非初次加载
                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
            })
            .catch((err) => {
                setError(err.message || '加载数据失败');
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    // 当选择具体章节时，加载该章经文
    useEffect(() => {
        if (!selectedBook || selectedChapter === null) {
            setChapterVerses([]);
            return;
        }

        setLoadingChapter(true);
        import('@/lib/dataLoader').then(({ loadChapterVerses }) => {
            loadChapterVerses(selectedBook.key, selectedChapter, language)
                .then((verses) => {
                    setChapterVerses(verses);
                    setLoadingChapter(false);
                })
                .catch((err) => {
                    console.error('加载章节经文失败:', err);
                    setChapterVerses([]);
                    setLoadingChapter(false);
                });
        });
    }, [selectedBook, selectedChapter, language]);

    // 检测URL分享参数并加载分享的经文
    useEffect(() => {
        if (typeof window === 'undefined' || books.length === 0) return;

        const urlParams = new URLSearchParams(window.location.search);
        const sharedParam = urlParams.get('s');

        if (sharedParam) {
            const decodedVerses = decodeVerseList(sharedParam);
            if (decodedVerses.length > 0) {
                setSharedVerses(decodedVerses);
                setShowShareBanner(true);

                // 加载分享的经文数据
                const loadSharedVerses = async () => {
                    try {
                        const { loadChapterVerses } = await import('@/lib/dataLoader');

                        // 按章节分组，减少请求次数
                        const chapterGroups = new Map<string, Set<number>>();
                        decodedVerses.forEach(({ bookKey, chapter, verse }) => {
                            const key = `${bookKey}-${chapter}`;
                            if (!chapterGroups.has(key)) {
                                chapterGroups.set(key, new Set());
                            }
                            chapterGroups.get(key)!.add(verse);
                        });

                        // 批量加载所有需要的章节
                        const allVerses: Verse[] = [];
                        for (const [key, verseNumbers] of chapterGroups) {
                            const lastDashIndex = key.lastIndexOf('-');
                            const bookKey = key.substring(0, lastDashIndex);
                            const chapterStr = key.substring(lastDashIndex + 1);
                            const chapter = parseInt(chapterStr);

                            const chapterVerses = await loadChapterVerses(bookKey, chapter, language);
                            // 只保留分享的那些节
                            const filteredVerses = chapterVerses.filter((v) => verseNumbers.has(v.verse));
                            allVerses.push(...filteredVerses);
                        }

                        setSharedVersesData(allVerses);
                    } catch (error) {
                        console.error('加载分享经文失败:', error);
                    }
                };

                loadSharedVerses();
            }
        }
    }, [books, language]);

    // 清理分享toast的timer
    useEffect(() => {
        if (shareToast.show) {
            const timer = setTimeout(() => setShareToast({ show: false, message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [shareToast.show]);

    // 筛选和排序经文
    const displayVerses = useMemo(() => {
        // 如果有分享链接，优先显示分享的经文
        if (showShareBanner && sharedVersesData.length > 0) {
            return sharedVersesData;
        }

        // 如果选择了具体章节，显示章节经文
        if (selectedChapter !== null && chapterVerses.length > 0) {
            return chapterVerses;
        }

        // 如果只选择了书卷但未选择章节，不显示经文（显示提示）
        if (selectedBook && selectedChapter === null) {
            return [];
        }

        // 否则显示精选经文（筛选后）
        let filtered = [...verses];

        // 应用收藏筛选
        if (filterType === 'favorites') {
            filtered = filtered.filter((v) => isFavorite(v.id));
        }

        // 随机排序（使用 Fisher-Yates 洗牌算法）
        if (shuffleKey > 0) {
            const shuffled = [...filtered];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            filtered = shuffled;
        }

        return filtered;
    }, [verses, chapterVerses, filterType, selectedBook, selectedChapter, shuffleKey, isFavorite, showShareBanner, sharedVersesData]);

    const handleShuffle = () => {
        setShuffleKey((prev) => prev + 1);
    };

    // 清除分享状态的辅助函数
    const clearShareState = () => {
        if (showShareBanner) {
            setShowShareBanner(false);
            setSharedVerses([]);
            setSharedVersesData([]);
            // 清除URL参数
            if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    };

    const handleFilterChange = (type: FilterType) => {
        setFilterType(type);
        setShowFilterMenu(false);
        clearShareState(); // 清除分享状态
    };

    const handleToggleFavorites = () => {
        setFilterType(filterType === 'favorites' ? 'all' : 'favorites');
        clearShareState(); // 清除分享状态
    };

    const handleBookSelect = (book: Book | null) => {
        setSelectedBook(book);
        setSelectedChapter(null);
        // 选择书卷时，重置收藏筛选
        if (book && filterType === 'favorites') {
            setFilterType('all');
        }
        clearShareState(); // 清除分享状态
    };

    const handleChapterSelect = (chapter: number | null) => {
        setSelectedChapter(chapter);
        clearShareState(); // 清除分享状态
    };

    const handleClearFilters = () => {
        setFilterType('all');
        setSelectedBook(null);
        setSelectedChapter(null);
        setShuffleKey(0);
        setShowAllContent(false); // 返回精选时切换到背诵模式
    };

    const handleViewInBible = (verse: Verse) => {
        // 找到对应的书卷
        const book = books.find(
            (b) => b.key === verse.bookKey || b.name === verse.book || b.nameSimplified === verse.book || b.nameTraditional === verse.book
        );

        if (book) {
            setSelectedBook(book);
            setSelectedChapter(verse.chapter);
            setShowAllContent(true); // 跳转到原文时自动切换到阅读模式
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 分享收藏功能
    const handleShareFavorites = () => {
        const favoritesList = getFavoritesList();

        if (favoritesList.length === 0) {
            return;
        }

        if (favoritesList.length > 200) {
            return; // 按钮应该已经是禁用状态
        }

        try {
            // 将 verseId (如"创世记-3-16") 转换为 {bookKey, chapter, verse}
            const versesToEncode = favoritesList
                .map((id) => {
                    const parts = id.split('-');
                    if (parts.length < 3) return null;

                    const verse = parseInt(parts[parts.length - 1]);
                    const chapter = parseInt(parts[parts.length - 2]);
                    const bookKey = parts.slice(0, -2).join('-');

                    return { bookKey, chapter, verse };
                })
                .filter((v): v is { bookKey: string; chapter: number; verse: number } => v !== null);

            const encoded = encodeVerseList(versesToEncode);
            const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encoded}`;

            // 检测是否为移动设备
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                // 移动端：先显示说明toast
                setShareToast({
                    show: true,
                    message: '已复制分享链接，发送给他人即可查看您的收藏',
                });
                // 2秒后复制链接
                setTimeout(() => {
                    navigator.clipboard.writeText(shareUrl);
                }, 2000);
            } else {
                // 桌面端：直接复制并显示toast
                navigator.clipboard.writeText(shareUrl);
                setShareToast({ show: true, message: '链接已复制' });
            }
        } catch (error) {
            console.error('生成分享链接失败:', error);
            setShareToast({ show: true, message: '分享失败，请稍后重试' });
        }
    };

    // 一键收藏分享的经文
    const handleAddAllShared = () => {
        const verseIds = sharedVerses.map((v) => `${v.bookKey}-${v.chapter}-${v.verse}`);
        addFavorites(verseIds);
        setShareToast({ show: true, message: `已添加 ${verseIds.length} 节经文到收藏` });
        clearShareState();
    };

    // 取消分享横幅
    const handleCancelShare = () => {
        clearShareState();
    };

    const favoritesCount = verses.filter((v) => isFavorite(v.id)).length;

    const hasActiveFilters = filterType !== 'all' || selectedBook !== null;

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800">
            {/* 顶部导航栏 */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-bible-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                    {/* 标题行 */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-bible-900 dark:text-bible-100 font-chinese flex items-center gap-3">
                                    <Image src="/logo.png" alt="你的話語 Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10" />
                                    你的話語
                                </h1>

                                {/* 状态徽章：显示当前模式 */}
                                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-bible-100 dark:bg-gray-700/50 text-bible-700 dark:text-bible-300 text-xs rounded-full font-chinese border border-bible-200/50 dark:border-gray-600/50">
                                    {hasActiveFilters ? (
                                        <>
                                            {selectedBook && (
                                                <>
                                                    <span className="font-semibold">{selectedBook.name}</span>
                                                    {selectedChapter && <span>第{selectedChapter}章</span>}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-1.5 h-1.5 bg-bible-500 dark:bg-bible-400 rounded-full animate-pulse"></span>
                                            <span>精選 114 節</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* 帮助按钮 */}
                            <button
                                onClick={handleOpenGuide}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="显示使用帮助"
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
                            >
                                <Languages className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                                    {language === 'simplified' ? '繁' : '簡'}
                                </span>
                            </button>

                            {/* 主题切换 */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={theme === 'light' ? '切换到深色模式' : theme === 'dark' ? '跟随系统' : '切换到浅色模式'}
                            >
                                {theme === 'light' ? (
                                    <Sun className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                ) : theme === 'dark' ? (
                                    <Moon className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                ) : (
                                    <Monitor className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                )}
                            </button>

                            {/* 一键返回按钮 */}
                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-600 dark:bg-bible-500 text-white hover:bg-bible-700 dark:hover:bg-bible-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    title="返回精选经文"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline font-chinese text-sm">返回</span>
                                </button>
                            )}

                            {/* 阅读/背诵模式切换（始终显示） */}
                            <button
                                onClick={() => setShowAllContent(!showAllContent)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={showAllContent ? '切换到背诵模式' : '切换到阅读模式'}
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
                        </div>
                    </div>

                    {/* 筛选工具栏 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 已收藏筛选 */}
                        {!selectedBook && (
                            <>
                                <button
                                    onClick={handleToggleFavorites}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm touch-manipulation min-h-[44px] ${
                                        filterType === 'favorites'
                                            ? 'bg-gold-500 dark:bg-gold-600 text-white hover:bg-gold-600 dark:hover:bg-gold-700'
                                            : 'bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 text-bible-700 dark:text-bible-300 border border-bible-200 dark:border-gray-700'
                                    }`}
                                    title={filterType === 'favorites' ? '显示全部' : '只看已收藏'}
                                >
                                    <Star className={`w-4 h-4 ${filterType === 'favorites' ? 'fill-white' : ''}`} />
                                    <span className="hidden sm:inline font-chinese text-sm">{filterType === 'favorites' ? '已收藏' : '收藏'}</span>
                                </button>

                                {/* 分享收藏按钮 - 只在收藏筛选模式下显示 */}
                                {filterType === 'favorites' && favoritesCount > 0 && (
                                    <button
                                        onClick={handleShareFavorites}
                                        disabled={favoritesCount > 200}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm touch-manipulation min-h-[44px] ${
                                            favoritesCount > 200
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                                        }`}
                                        title={
                                            favoritesCount > 200
                                                ? '收藏过多（超过200节），无法生成分享链接'
                                                : '点击生成分享链接，可将您的收藏分享给他人'
                                        }
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span className="hidden sm:inline font-chinese text-sm">分享</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* 书卷选择器 */}
                        <Listbox value={selectedBook} onChange={handleBookSelect}>
                            {({ open }) => (
                                <div className="relative">
                                    <Listbox.Button className="relative w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm font-chinese text-sm text-bible-700 dark:text-bible-300 text-left cursor-pointer touch-manipulation min-h-[44px]">
                                        <span className="block">{selectedBook?.name || '选择书卷'}</span>
                                        <ChevronDown
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-700 dark:text-bible-300 transition-transform ${
                                                open ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </Listbox.Button>
                                    <Transition
                                        enter="transition duration-100 ease-out"
                                        enterFrom="transform scale-95 opacity-0"
                                        enterTo="transform scale-100 opacity-100"
                                        leave="transition duration-75 ease-out"
                                        leaveFrom="transform scale-100 opacity-100"
                                        leaveTo="transform scale-95 opacity-0"
                                    >
                                        <Listbox.Options className="absolute z-20 mt-1 min-w-full w-max max-h-[70vh] overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none scrollbar-thin">
                                            <Listbox.Option
                                                value={null}
                                                className={({ active }) =>
                                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 font-chinese text-sm ${
                                                        active
                                                            ? 'bg-bible-100 dark:bg-gray-700 text-bible-900 dark:text-bible-100'
                                                            : 'text-bible-700 dark:text-bible-300'
                                                    }`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block ${selected ? 'font-semibold' : 'font-normal'}`}>选择书卷</span>
                                                        {selected && (
                                                            <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                        )}
                                                    </>
                                                )}
                                            </Listbox.Option>

                                            {/* 旧约 */}
                                            <div className="px-3 py-1 text-xs font-semibold text-bible-500 dark:text-bible-400 bg-bible-50 dark:bg-gray-900/50 border-t border-b border-bible-100 dark:border-gray-700 font-chinese">
                                                旧约
                                            </div>
                                            {books
                                                .filter((b) => b.testament === 'old')
                                                .map((book) => (
                                                    <Listbox.Option
                                                        key={book.key}
                                                        value={book}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none py-2 pl-10 pr-4 font-chinese text-sm ${
                                                                active
                                                                    ? 'bg-bible-100 dark:bg-gray-700 text-bible-900 dark:text-bible-100'
                                                                    : 'text-bible-700 dark:text-bible-300'
                                                            }`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                    {book.name}
                                                                </span>
                                                                {selected && (
                                                                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}

                                            {/* 新约 */}
                                            <div className="px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-t border-b border-blue-100 dark:border-blue-800 font-chinese mt-1">
                                                新约
                                            </div>
                                            {books
                                                .filter((b) => b.testament === 'new')
                                                .map((book) => (
                                                    <Listbox.Option
                                                        key={book.key}
                                                        value={book}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none py-2 pl-10 pr-4 font-chinese text-sm ${
                                                                active
                                                                    ? 'bg-bible-100 dark:bg-gray-700 text-bible-900 dark:text-bible-100'
                                                                    : 'text-bible-700 dark:text-bible-300'
                                                            }`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                    {book.name}
                                                                </span>
                                                                {selected && (
                                                                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            )}
                        </Listbox>

                        {/* 章节选择器 */}
                        {selectedBook && (
                            <>
                                <Listbox value={selectedChapter} onChange={handleChapterSelect}>
                                    {({ open }) => (
                                        <div className="relative">
                                            <Listbox.Button className="relative w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm font-chinese text-sm text-bible-700 dark:text-bible-300 text-left cursor-pointer touch-manipulation min-h-[44px]">
                                                <span className="block">{selectedChapter ? `第 ${selectedChapter} 章` : '所有章节'}</span>
                                                <ChevronDown
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400 transition-transform ${
                                                        open ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </Listbox.Button>
                                            <Transition
                                                enter="transition duration-100 ease-out"
                                                enterFrom="transform scale-95 opacity-0"
                                                enterTo="transform scale-100 opacity-100"
                                                leave="transition duration-75 ease-out"
                                                leaveFrom="transform scale-100 opacity-100"
                                                leaveTo="transform scale-95 opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-20 mt-1 min-w-full w-max max-h-[70vh] overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none scrollbar-thin">
                                                    <Listbox.Option
                                                        value={null}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none py-2 pl-10 pr-4 font-chinese text-sm ${
                                                                active
                                                                    ? 'bg-bible-100 dark:bg-gray-700 text-bible-900 dark:text-bible-100'
                                                                    : 'text-bible-700 dark:text-bible-300'
                                                            }`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                    所有章节
                                                                </span>
                                                                {selected && (
                                                                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                                                        <Listbox.Option
                                                            key={ch}
                                                            value={ch}
                                                            className={({ active }) =>
                                                                `relative cursor-pointer select-none py-2 pl-10 pr-4 font-chinese text-sm ${
                                                                    active
                                                                        ? 'bg-bible-100 dark:bg-gray-700 text-bible-900 dark:text-bible-100'
                                                                        : 'text-bible-700 dark:text-bible-300'
                                                                }`
                                                            }
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                        第 {ch} 章
                                                                    </span>
                                                                    {selected && (
                                                                        <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    )}
                                </Listbox>

                                {/* 重置章节按钮 */}
                                {selectedChapter !== null && (
                                    <button
                                        onClick={() => handleChapterSelect(null)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm touch-manipulation min-h-[44px]"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="重置章节选择"
                                    >
                                        <RotateCcw className="w-4 h-4 text-bible-700 dark:text-bible-300" />
                                        <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">重选</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* 随机按钮 - 只在精选经文界面显示 */}
                        {!selectedChapter && !selectedBook && (
                            <button
                                onClick={handleShuffle}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="重新排列"
                            >
                                <Shuffle className="w-4 h-4 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">随机</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 分享横幅 */}
            <AnimatePresence>
                {showShareBanner && sharedVerses.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800 py-4"
                    >
                        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-center sm:text-left">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 font-chinese">
                                        这是分享的收藏列表（共 {sharedVerses.length} 节经文）
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-chinese">您可以一键将这些经文添加到自己的收藏中</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAddAllShared}
                                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors font-chinese text-sm font-medium shadow-sm touch-manipulation min-h-[44px]"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                >
                                    一键全部收藏
                                </button>
                                <button
                                    onClick={handleCancelShare}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors font-chinese text-sm border border-blue-200 dark:border-blue-700 touch-manipulation min-h-[44px]"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 分享Toast通知 */}
            <AnimatePresence>
                {shareToast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md mx-4"
                    >
                        <div className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 rounded-xl shadow-2xl text-sm font-chinese flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                            <span>{shareToast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 关闭引导提示 - 浮动通知 */}
            <AnimatePresence>
                {showGuideHint && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md mx-4"
                    >
                        <div className="p-4 bg-bible-50 dark:bg-gray-800 border-2 border-bible-300 dark:border-gray-600 text-bible-800 dark:text-bible-200 rounded-xl shadow-2xl text-sm font-chinese flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-white" />
                            </div>
                            <span>
                                引导已关闭。如需再次查看，请点击右上角的{' '}
                                <span className="font-semibold text-bible-700 dark:text-bible-300">「帮助」</span> 按钮
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 使用提示和统计信息 */}
            <motion.div className="max-w-7xl mx-auto px-4 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* 引导说明 */}
                {showGuide && (
                    <motion.div
                        className="mb-3 p-5 bg-gradient-to-br from-bible-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl border-2 border-bible-300/50 dark:border-gray-700 shadow-lg"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-bible-500 to-blue-600 dark:from-bible-600 dark:to-blue-700 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white text-xl">💡</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-base font-bold text-bible-900 dark:text-bible-100 font-chinese">
                                        歡迎使用「你的話語」聖經背誦助手 ✨
                                    </h3>
                                    <button
                                        onClick={handleCloseGuide}
                                        className="flex-shrink-0 ml-2 p-2 hover:bg-bible-200/50 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="关闭引导"
                                    >
                                        <X className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                    </button>
                                </div>

                                <div className="text-xs text-bible-700 dark:text-bible-300 font-chinese space-y-2.5">
                                    <div className="flex items-start gap-2">
                                        <span className="text-base">📖</span>
                                        <div>
                                            <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">默認顯示：精選經文</p>
                                            <p className="text-bible-600 dark:text-bible-400">
                                                當前頁面展示精心挑選的{' '}
                                                <span className="font-semibold text-bible-700 dark:text-bible-300">114 節最值得背誦的經文</span>，
                                                這些經文涵蓋了信仰的核心真理，適合初學者和進階學習。
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="text-base">🎯</span>
                                        <div>
                                            <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">Flash Card 背誦模式</p>
                                            <p className="text-bible-600 dark:text-bible-400">
                                                每張卡片<span className="font-semibold">默認隱藏大部分內容</span>（只顯示前幾個字），
                                                <span className="font-semibold">點擊卡片</span>即可展開查看完整經文。 嘗試先回憶，再驗證！
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="text-base">📚</span>
                                        <div>
                                            <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">逐節學習：選擇書卷</p>
                                            <p className="text-bible-600 dark:text-bible-400">
                                                使用頂部的<span className="font-semibold">「選擇書卷」</span>和
                                                <span className="font-semibold">「選擇章節」</span>篩選器， 可以瀏覽聖經 66
                                                卷書的任意章節，逐節背誦或閱讀。
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="text-base">👁️</span>
                                        <div>
                                            <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">雙模式切換：阅读 / 背诵</p>
                                            <p className="text-bible-600 dark:text-bible-400">
                                                點擊右上角的<span className="font-semibold">「阅读/背诵」</span>按鈕， 可以在
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">阅读模式</span>（顯示全部） 和
                                                <span className="font-semibold text-purple-600 dark:text-purple-400">背诵模式</span>
                                                （隱藏內容）之間切換。
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="text-base">⭐</span>
                                        <div>
                                            <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">收藏功能</p>
                                            <p className="text-bible-600 dark:text-bible-400">
                                                點擊卡片右上角的<span className="font-semibold">星標圖示</span>可以收藏喜歡的經文，
                                                之後可以使用「收藏」篩選器快速查看。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 状态标签和统计 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        {filterType === 'favorites' && (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded-full text-xs font-medium border border-gold-200 dark:border-gold-800">
                                <Star className="w-3 h-3 fill-current" />
                                已收藏
                            </span>
                        )}

                        {showAllContent && (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800">
                                <Eye className="w-3 h-3" />
                                阅读模式
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-bible-500 dark:text-bible-400 font-chinese">
                            共 <span className="font-semibold text-bible-700 dark:text-bible-300">{displayVerses.length}</span> 节
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* 经文卡片区域 */}
            <div className="max-w-7xl mx-auto">
                {loadingChapter ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
                        <p className="mt-4 text-bible-600 dark:text-bible-400 font-chinese">加载经文中...</p>
                    </div>
                ) : selectedBook && selectedChapter === null ? (
                    // 选择了书卷但未选择章节，显示章节选择器
                    <div className="py-12 px-4">
                        <div className="text-center mb-8">
                            <Image src="/logo.png" alt="你的話語" width={64} height={64} className="w-16 h-16 mx-auto mb-4 opacity-60" />
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 mb-2 font-chinese">请选择章节</h3>
                            <p className="text-bible-600 dark:text-bible-400 font-chinese">
                                {selectedBook.name} 共有 {selectedBook.chapters} 章
                            </p>
                        </div>

                        {/* 章节按钮网格 */}
                        <div className="max-w-4xl mx-auto grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 md:gap-3">
                            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapterNum) => (
                                <motion.button
                                    key={chapterNum}
                                    onClick={() => handleChapterSelect(chapterNum)}
                                    className="aspect-square flex items-center justify-center bg-bible-100 dark:bg-gray-700 hover:bg-bible-500 hover:text-white dark:hover:bg-bible-600 text-bible-800 dark:text-bible-200 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 touch-manipulation"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title={`第 ${chapterNum} 章`}
                                >
                                    {chapterNum}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : displayVerses.length > 0 ? (
                    <MasonryLayout
                        key={isInitialLoad ? 'initial' : shuffleKey}
                        verses={displayVerses}
                        defaultRevealed={showAllContent}
                        onViewInBible={handleViewInBible}
                    />
                ) : (
                    <div className="text-center py-20">
                        <p className="text-bible-600 dark:text-bible-400 font-chinese">暂无经文</p>
                    </div>
                )}
            </div>
        </div>
    );
}
