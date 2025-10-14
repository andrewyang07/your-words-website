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
    Info,
} from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import Image from 'next/image';
import { useVerseStore } from '@/stores/useVerseStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Verse, Book } from '@/types/verse';
import { encodeVerseList, decodeVerseList } from '@/lib/bibleBookMapping';
import { logError } from '@/lib/errorHandler';
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
    const [hasAddedAllShared, setHasAddedAllShared] = useState(false); // 是否已一键收藏

    // 收藏经文的完整数据
    const [favoritesVersesData, setFavoritesVersesData] = useState<Verse[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    // 心版 App 推广卡片显示状态（每次刷新都显示）
    const [showAppPromo, setShowAppPromo] = useState(true);

    // 关于弹窗显示状态
    const [showAbout, setShowAbout] = useState(false);

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
                    logError('HomePage:loadChapterVerses', err);
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
                setShowAllContent(true); // 自动切换到阅读模式，显示所有内容

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
                        logError('HomePage:loadSharedVerses', error);
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

    // 当切换到收藏模式时，加载所有收藏的经文
    useEffect(() => {
        if (filterType !== 'favorites' || books.length === 0) {
            setFavoritesVersesData([]);
            return;
        }

        const loadAllFavorites = async () => {
            setLoadingFavorites(true);
            try {
                const favoriteIds = getFavoritesList();
                if (favoriteIds.length === 0) {
                    setFavoritesVersesData([]);
                    setLoadingFavorites(false);
                    return;
                }

                const { loadChapterVerses } = await import('@/lib/dataLoader');

                // 解析所有收藏的ID并按章节分组
                const chapterGroups = new Map<string, Set<number>>();
                const parsedFavorites: Array<{ bookKey: string; chapter: number; verse: number }> = [];

                favoriteIds.forEach((id) => {
                    const parts = id.split('-');
                    if (parts.length < 3) return;

                    const verse = parseInt(parts[parts.length - 1]);
                    const chapter = parseInt(parts[parts.length - 2]);
                    const bookKey = parts.slice(0, -2).join('-');

                    parsedFavorites.push({ bookKey, chapter, verse });

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

                    try {
                        const chapterVerses = await loadChapterVerses(bookKey, chapter, language);
                        // 只保留收藏的那些节
                        const filteredVerses = chapterVerses.filter((v) => verseNumbers.has(v.verse));
                        allVerses.push(...filteredVerses);
                    } catch (error) {
                        logError('HomePage:loadFavoritesChapter', `加载章节失败 ${bookKey} ${chapter}: ${error}`);
                        // 继续加载其他章节
                    }
                }

                setFavoritesVersesData(allVerses);
            } catch (error) {
                logError('HomePage:loadFavorites', error);
                setFavoritesVersesData([]);
            } finally {
                setLoadingFavorites(false);
            }
        };

        loadAllFavorites();
    }, [filterType, books, language, getFavoritesList]);

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

        // 如果是收藏模式，显示所有收藏的经文
        if (filterType === 'favorites') {
            let favFiltered = [...favoritesVersesData];
            // 收藏模式也支持随机排序
            if (shuffleKey > 0) {
                const shuffled = [...favFiltered];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                favFiltered = shuffled;
            }
            return favFiltered;
        }

        // 否则显示精选经文
        let filtered = [...verses];

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
    }, [
        verses,
        chapterVerses,
        filterType,
        selectedBook,
        selectedChapter,
        shuffleKey,
        isFavorite,
        showShareBanner,
        sharedVersesData,
        favoritesVersesData,
    ]);

    const handleShuffle = () => {
        setShuffleKey((prev) => prev + 1);
    };

    // 清除分享状态的辅助函数
    const clearShareState = () => {
        if (showShareBanner) {
            setShowShareBanner(false);
            setSharedVerses([]);
            setSharedVersesData([]);
            setHasAddedAllShared(false); // 重置收藏状态
            // 清除URL参数
            if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    };

    const handleFilterChange = (type: FilterType) => {
        setFilterType(type);
        setShowFilterMenu(false);
        // 不清除分享状态，保留URL
    };

    const handleToggleFavorites = () => {
        if (filterType === 'favorites') {
            // 退出收藏模式
            setFilterType('all');
            setShuffleKey(0); // 重置随机状态
        } else {
            // 进入收藏模式，清除书卷和章节选择
            setFilterType('favorites');
            setSelectedBook(null);
            setSelectedChapter(null);
            setShuffleKey(0); // 重置随机状态，默认按顺序显示
        }
        // 不清除分享状态，保留URL
    };

    const handleBookSelect = (book: Book | null) => {
        setSelectedBook(book);
        setSelectedChapter(null);
        setShuffleKey(0); // 重置随机状态，章节内容需要按顺序显示
        // 选择书卷时，重置收藏筛选
        if (book && filterType === 'favorites') {
            setFilterType('all');
        }
        // 不清除分享状态，保留URL
    };

    const handleChapterSelect = (chapter: number | null) => {
        setSelectedChapter(chapter);
        // 选择章节后自动切换到阅读模式，方便查看
        if (chapter !== null) {
            setShowAllContent(true);
        }
        // 不清除分享状态，保留URL
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
            // 如果在分享状态下，先清除分享状态
            if (showShareBanner) {
                clearShareState();
            }

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
            logError('HomePage:handleShareFavorites', error);
            setShareToast({ show: true, message: '分享失败，请稍后重试' });
        }
    };

    // 一键收藏分享的经文
    const handleAddAllShared = () => {
        // 使用 sharedVersesData（实际加载的经文）的 id，而不是手动拼接
        const verseIds = sharedVersesData.map((v) => v.id);
        addFavorites(verseIds);
        setHasAddedAllShared(true); // 标记为已收藏
        setShareToast({ show: true, message: `已添加 ${verseIds.length} 节经文到收藏` });
        // 不立即清除横幅，让用户看到星星变化
        // 用户可以手动点击"取消"或刷新页面
    };

    // 取消分享横幅
    const handleCancelShare = () => {
        clearShareState();
    };

    // 使用 getFavoritesList 获取真实的收藏总数（不受当前筛选影响）
    const favoritesCount = getFavoritesList().length;

    const hasActiveFilters = filterType !== 'all' || selectedBook !== null;

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800">
            {/* 顶部导航栏 */}
            <header
                className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-bible-200 dark:border-gray-700"
                role="banner"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                    {/* 标题行 */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-extrabold font-chinese flex items-center gap-3">
                                <Image
                                    src="/logo-light.png"
                                    alt="你的話語 Logo"
                                    width={40}
                                    height={40}
                                    priority
                                    className="w-8 h-8 md:w-10 md:h-10 dark:brightness-90 dark:contrast-125"
                                />
                                <span
                                    className="text-bible-700 dark:text-bible-300 tracking-wide"
                                    style={{
                                        textShadow: '0 0 12px rgba(190,158,93,0.3), 0 0 24px rgba(190,158,93,0.15), 0 1px 2px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    你的話語
                                </span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* 关于按钮 */}
                            <button
                                onClick={() => setShowAbout(true)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="关于本站"
                                aria-label="关于本站"
                            >
                                <Info className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">关于</span>
                            </button>

                            {/* 帮助按钮 */}
                            <button
                                onClick={handleOpenGuide}
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

                            {/* 主题切换 */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={theme === 'light' ? '切换到深色模式' : theme === 'dark' ? '跟随系统' : '切换到浅色模式'}
                                aria-label={theme === 'light' ? '切换到深色模式' : theme === 'dark' ? '切换到跟随系统模式' : '切换到浅色模式'}
                            >
                                {theme === 'light' ? (
                                    <Sun className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                ) : theme === 'dark' ? (
                                    <Moon className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                ) : (
                                    <Monitor className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                )}
                            </button>

                            {/* 阅读/背诵模式切换（始终显示） */}
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
                        </div>
                    </div>

                    {/* 筛选工具栏 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 已收藏筛选 - 始终显示 */}
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
                                title={favoritesCount > 200 ? '收藏过多（超过200节），无法生成分享链接' : '点击生成分享链接，可将您的收藏分享给他人'}
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline font-chinese text-sm">分享</span>
                            </button>
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

                                {/* 返回按钮 - 智能显示 */}
                                {selectedBook && (
                                    <button
                                        onClick={selectedChapter ? () => handleChapterSelect(null) : handleClearFilters}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm touch-manipulation min-h-[44px]"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title={selectedChapter ? '返回章节选择' : '返回精选经文'}
                                    >
                                        <RotateCcw className="w-4 h-4 text-bible-700 dark:text-bible-300" />
                                        <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                                            {selectedChapter ? '重选章节' : '返回'}
                                        </span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* 随机按钮 - 在精选经文和收藏界面显示，选择书卷/章节时隐藏 */}
                        {!selectedBook && (
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
            </header>

            {/* 主内容区域 */}
            <main role="main" aria-label="圣经经文内容">
                {/* 分享横幅 */}
                <AnimatePresence>
                    {showShareBanner && sharedVerses.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800 py-4"
                            role="alert"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3 text-center sm:text-left">
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                            hasAddedAllShared ? 'bg-green-500 dark:bg-green-600' : 'bg-blue-500 dark:bg-blue-600'
                                        }`}
                                    >
                                        {hasAddedAllShared ? (
                                            <Star className="w-5 h-5 text-white fill-white" />
                                        ) : (
                                            <Share2 className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 font-chinese">
                                            {hasAddedAllShared
                                                ? `已成功收藏 ${sharedVerses.length} 节经文 ✨`
                                                : `这是分享的收藏列表（共 ${sharedVerses.length} 节经文）`}
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 font-chinese">
                                            {hasAddedAllShared
                                                ? '所有卡片已标记为收藏，可以点击"取消"关闭此提示'
                                                : '您可以一键将这些经文添加到自己的收藏中'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!hasAddedAllShared && (
                                        <button
                                            onClick={handleAddAllShared}
                                            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors font-chinese text-sm font-medium shadow-sm touch-manipulation min-h-[44px]"
                                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        >
                                            一键全部收藏
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCancelShare}
                                        className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors font-chinese text-sm border border-blue-200 dark:border-blue-700 touch-manipulation min-h-[44px]"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    >
                                        {hasAddedAllShared ? '关闭' : '取消'}
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

                {/* 关于弹窗 */}
                <AnimatePresence>
                    {showAbout && (
                        <>
                            {/* 背景遮罩 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                                onClick={() => setShowAbout(false)}
                            />

                            {/* 弹窗内容 */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-4 md:inset-0 md:flex md:items-center md:justify-center z-50"
                            >
                                <div className="h-full md:h-auto md:max-h-[85vh] md:w-full md:max-w-3xl bg-gradient-to-br from-white to-bible-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border-2 border-bible-200 dark:border-gray-700">
                                    {/* 标题栏 */}
                                    <div className="flex items-center justify-between p-5 md:p-6 border-b border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-bible-500 to-bible-600 dark:from-bible-400 dark:to-bible-500 rounded-xl flex items-center justify-center shadow-md">
                                                <Info className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-bible-800 dark:text-bible-200 font-chinese">關於本站</h2>
                                        </div>
                                        <button
                                            onClick={() => setShowAbout(false)}
                                            className="p-2 hover:bg-bible-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title="关闭"
                                        >
                                            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* 内容区域 */}
                                    <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 font-chinese">
                                        {/* 开发故事 */}
                                        <section>
                                            <h3 className="text-lg font-bold text-bible-700 dark:text-bible-300 mb-3 flex items-center gap-2">
                                                <span className="text-2xl">📱</span>從 App 到 Web 的旅程
                                            </h3>
                                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                <p>
                                                    最初，我投入大量心血開發了一款名為「你的話語」的 iOS App，並成功在全球 App Store 上架。
                                                    雖然這款 App 採用卡片形式幫助弟兄姊妹背誦經文，但效果並不如預期。
                                                </p>
                                                <p>
                                                    然而，隨著時間推移，我逐漸意識到 App 的局限性：許多基督徒並不經常使用手機，
                                                    而網站的使用門檻更低，無需下載安裝，任何設備都能輕鬆訪問。
                                                </p>
                                                <p>
                                                    在一次主日講道中，我突然有了新的想法（
                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                        友情提醒：請不要效法我，還是要好好聽講道 😊
                                                    </span>
                                                    ），決定將這個概念轉化為網站。這兩張潦草的草圖，見證了從想法到現實的第一步。
                                                </p>
                                            </div>
                                        </section>

                                        {/* 草图展示 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md border border-bible-200 dark:border-gray-600">
                                                <Image
                                                    src="/sketch-1.jpeg"
                                                    alt="網站構思草圖 1"
                                                    width={600}
                                                    height={450}
                                                    className="w-full h-auto object-cover"
                                                />
                                                <p className="p-2 text-xs text-center text-gray-500 dark:text-gray-400">構思草圖（一）</p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md border border-bible-200 dark:border-gray-600">
                                                <Image
                                                    src="/sketch-2.jpeg"
                                                    alt="網站構思草圖 2"
                                                    width={600}
                                                    height={450}
                                                    className="w-full h-auto object-cover"
                                                />
                                                <p className="p-2 text-xs text-center text-gray-500 dark:text-gray-400">構思草圖（二）</p>
                                            </div>
                                        </div>

                                        {/* 初心与使命 */}
                                        <section>
                                            <h3 className="text-lg font-bold text-bible-700 dark:text-bible-300 mb-3 flex items-center gap-2">
                                                <span className="text-2xl">💝</span>
                                                初心與使命
                                            </h3>
                                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                <p>
                                                    這個網站的誕生，源於一個簡單卻深刻的渴望 —— 幫助自己和其他基督徒將神的話語藏在心裡。 正如
                                                    <span className="font-semibold text-bible-600 dark:text-bible-400">詩篇 119:11</span> 所說：
                                                </p>
                                                <blockquote className="pl-4 border-l-4 border-bible-400 dark:border-bible-500 italic text-bible-700 dark:text-bible-300 bg-bible-50 dark:bg-gray-800 p-3 rounded-r-lg">
                                                    「我將你的話藏在心裡，免得我得罪你。」
                                                </blockquote>
                                                <p>
                                                    <span className="font-semibold text-bible-600 dark:text-bible-400">
                                                        神的話語充滿力量，充滿能力
                                                    </span>
                                                    ， 能夠在我們軟弱時堅固我們，在迷茫時指引我們。
                                                </p>
                                                <p className="text-bible-700 dark:text-bible-300 font-medium">
                                                    願這個小小的工具，成為你背誦聖經旅程中的幫助。🙏
                                                </p>
                                            </div>
                                        </section>

                                        {/* 技术栈 */}
                                        <section>
                                            <h3 className="text-lg font-bold text-bible-700 dark:text-bible-300 mb-3 flex items-center gap-2">
                                                <span className="text-2xl">⚙️</span>
                                                技術棧
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Zustand'].map((tech) => (
                                                    <span
                                                        key={tech}
                                                        className="px-3 py-1 bg-bible-100 dark:bg-gray-700 text-bible-700 dark:text-bible-300 rounded-full text-xs font-medium"
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>

                                        {/* 开源与联系 */}
                                        <section>
                                            <h3 className="text-lg font-bold text-bible-700 dark:text-bible-300 mb-3 flex items-center gap-2">
                                                <span className="text-2xl">🤝</span>
                                                開源與聯繫
                                            </h3>
                                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                <p>
                                                    這個項目我計劃在未來開源，希望能有更多志同道合的弟兄姊妹一起參與開發，
                                                    讓這個工具變得更好，幫助更多人將神的話語藏在心裡。
                                                </p>
                                                <p>
                                                    如果你有任何想法、建議或反饋，歡迎聯繫我：
                                                    <a
                                                        href="mailto:yy9577@gmail.com"
                                                        className="ml-1 text-bible-600 dark:text-bible-400 hover:text-bible-700 dark:hover:text-bible-300 font-medium underline"
                                                    >
                                                        yy9577@gmail.com
                                                    </a>
                                                </p>
                                            </div>
                                        </section>

                                        {/* 版权信息 */}
                                        <div className="pt-4 border-t border-bible-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                                            <p>© 2025 你的話語 · Made with ❤️ for Christ</p>
                                            <p className="mt-1">All Bible verses are from Chinese Union Version (CUV/CUVT)</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
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
                                                    之後可以使用「收藏」篩選器快速查看。可收藏任何章節的經文，不限於精選經文。
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <span className="text-base">🔗</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">分享收藏</p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    在「收藏」模式下，點擊<span className="font-semibold">「分享」</span>按鈕可生成專屬鏈接，
                                                    將您的收藏分享給其他人。對方打開鏈接後，可一鍵將所有經文添加到自己的收藏中。
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-bible-200/50 dark:border-gray-700">
                                            <div className="flex items-start gap-2">
                                                <span className="text-base">📱</span>
                                                <div>
                                                    <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">
                                                        iPhone 用戶推薦：心版 App
                                                    </p>
                                                    <p className="text-bible-600 dark:text-bible-400">
                                                        使用 iPhone？試試<span className="font-semibold">「心版」iOS App</span>， 將經文以
                                                        <span className="font-semibold">小組件形式</span>展示在主屏幕上。
                                                        每次解鎖手機，第一眼就看到神的話語。支持雙語對照、自定義樣式，完全免費。
                                                        <a
                                                            href="https://apps.apple.com/app/6744570052"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center ml-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                                        >
                                                            前往下載 →
                                                        </a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 状态标签和统计 */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* 默认精选经文提示 */}
                            {!selectedBook && filterType !== 'favorites' && !showShareBanner && (
                                <span className="text-xs text-bible-600 dark:text-bible-400 font-chinese">📖 精選 114 節經文</span>
                            )}

                            {filterType === 'favorites' && (
                                <>
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded-full text-xs font-medium border border-gold-200 dark:border-gold-800">
                                        <Star className="w-3 h-3 fill-current" />
                                        已收藏
                                    </span>
                                    {favoritesCount > 0 && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-chinese">💡 可生成鏈接分享</span>
                                    )}
                                </>
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
                    {loadingChapter || loadingFavorites ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
                            <p className="mt-4 text-bible-600 dark:text-bible-400 font-chinese">加载经文中...</p>
                        </div>
                    ) : selectedBook && selectedChapter === null ? (
                        // 选择了书卷但未选择章节，显示章节选择器
                        <div className="py-12 px-4">
                            <div className="text-center mb-8">
                                <Image
                                    src="/logo-light.png"
                                    alt="你的話語"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 mx-auto mb-4 opacity-60 dark:brightness-90 dark:contrast-125"
                                />
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
                                        className="aspect-square flex items-center justify-center bg-bible-100 dark:bg-gray-700 text-bible-800 dark:text-bible-200 rounded-lg font-semibold shadow-sm touch-manipulation transition-colors duration-200"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        whileHover={{
                                            scale: 1.05,
                                            backgroundColor: 'rgb(190, 158, 93)',
                                            color: '#ffffff',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
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

                {/* iOS App 推广区块 - Mini版 */}
                <AnimatePresence>
                    {showAppPromo && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-7xl mx-auto px-4 py-6 mt-4"
                        >
                            <div className="relative bg-gradient-to-r from-bible-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-md border border-bible-200 dark:border-gray-600 overflow-hidden">
                                {/* 关闭按钮 */}
                                <button
                                    onClick={() => setShowAppPromo(false)}
                                    className="absolute top-2 right-2 p-1.5 hover:bg-bible-200/50 dark:hover:bg-gray-600 rounded-lg transition-colors z-10"
                                    title="关闭推广"
                                    aria-label="关闭心版推广"
                                >
                                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </button>

                                <a
                                    href="https://apps.apple.com/app/6744570052"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 md:p-5 hover:bg-bible-100/30 dark:hover:bg-gray-700/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Logo */}
                                        <div className="flex-shrink-0">
                                            <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-gray-700 rounded-[18%] shadow-md flex items-center justify-center p-2.5 overflow-hidden">
                                                <Image
                                                    src="/xinban-logo.png"
                                                    alt="心版 App Logo"
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>

                                        {/* 内容 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-lg md:text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">心版</h4>
                                                <span className="px-1.5 py-0.5 bg-bible-500 text-white text-[10px] font-semibold rounded">iOS</span>
                                                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>⭐</span>
                                                    <span className="font-medium">5.0</span>
                                                </div>
                                            </div>
                                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-chinese line-clamp-2">
                                                將經文系在指頭上，刻在心版上 · 主屏幕小組件 · 雙語對照 · 免費下載
                                            </p>
                                        </div>

                                        {/* 按钮 */}
                                        <div className="flex-shrink-0 hidden md:block">
                                            <div className="px-4 py-2 bg-bible-600 hover:bg-bible-700 text-white text-sm font-semibold rounded-lg transition-colors font-chinese whitespace-nowrap">
                                                前往 App Store →
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 页脚 */}
                <footer className="border-t border-bible-200 dark:border-gray-700 mt-12">
                    <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 font-chinese">
                        <p>願神的話語常在你心中 🙏</p>
                        <p className="mt-2 text-xs">© 2025 你的話語 · Made with ❤️ for Christ</p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
