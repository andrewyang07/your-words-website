'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
    Menu,
    ArrowLeft,
    Users,
} from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import Image from 'next/image';
import { useVerseStore } from '@/stores/useVerseStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Verse, Book } from '@/types/verse';
import { encodeVerseList, decodeVerseList } from '@/lib/bibleBookMapping';
import { logError } from '@/lib/errorHandler';
import MaskSettings from '@/components/settings/MaskSettings';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MasonryLayout from '@/components/verses/MasonryLayout';
import { trackUser, getVerseNumericId } from '@/lib/statsUtils';

// 动态导入非关键组件以提升性能
const SideMenu = dynamic(() => import('@/components/navigation/SideMenu'), {
    ssr: false,
});

type FilterType = 'all' | 'old' | 'new' | 'favorites';
type BookFilterType = 'all' | 'old' | 'new' | string; // string 为具体书卷名

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

    // 筛选状态
    const [bookFilter, setBookFilter] = useState<BookFilterType>('all');

    // 收藏模式的筛选状态
    const [favoritesBookFilter, setFavoritesBookFilter] = useState<BookFilterType>('all');

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

    // 侧边栏菜单显示状态
    const [showSideMenu, setShowSideMenu] = useState(false);

    // 懒加载状态 - 根据设备响应式显示
    const getInitialCount = () => {
        if (typeof window === 'undefined') return 24; // SSR 时默认
        const width = window.innerWidth;
        if (width < 768) return 12; // 手机：12 张（单列）
        if (width < 1024) return 18; // 平板：18 张（2列）
        return 24; // 桌面：24 张（4列）
    };
    const [visibleCount, setVisibleCount] = useState(getInitialCount);

    // 全局统计数据（默认显示 0，方便本地开发）
    const [globalStats, setGlobalStats] = useState<{ totalUsers: number; totalFavorites: number }>({
        totalUsers: 0,
        totalFavorites: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [showStatsModal, setShowStatsModal] = useState(false); // 移动端统计 modal

    // 滚动监听 - 懒加载更多卡片
    useEffect(() => {
        let isLoading = false;

        const handleScroll = () => {
            // 防止频繁触发
            if (isLoading) return;

            // 检测是否滚动到接近底部（距离底部 500px 时加载）
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollHeight - scrollTop - clientHeight < 500) {
                isLoading = true;
                setVisibleCount((prev) => {
                    // 根据设备调整每次加载数量
                    const width = window.innerWidth;
                    const increment = width < 768 ? 12 : width < 1024 ? 18 : 24;

                    // 加载完成后重置标志
                    setTimeout(() => {
                        isLoading = false;
                    }, 300);
                    return prev + increment;
                });
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 从 localStorage 读取引导卡片状态
    useEffect(() => {
        const guideDismissed = localStorage.getItem('guide-dismissed');
        if (guideDismissed === 'true') {
            setShowGuide(false);
        }
    }, []);

    // 追踪用户访问和获取全局统计
    useEffect(() => {
        // 追踪新用户
        trackUser();

        // 获取全局统计数据（带错误处理和加载状态）
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/stats');
                if (response.ok) {
                    const data = await response.json();
                    setGlobalStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                // 静默失败，不影响页面显示
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
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

    // 检测 URL 参数（分享和来源）
    const fromBibleNote = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'bible-note';

    // 检测 URL 参数：书卷和章节（从总排行榜跳转）
    useEffect(() => {
        if (typeof window === 'undefined' || books.length === 0) return;

        const urlParams = new URLSearchParams(window.location.search);
        const bookParam = urlParams.get('book');
        const chapterParam = urlParams.get('chapter');

        if (bookParam && chapterParam) {
            // 查找对应的书卷
            const book = books.find(
                (b) =>
                    b.nameTraditional === bookParam ||
                    b.nameSimplified === bookParam ||
                    b.key === bookParam ||
                    b.nameEnglish === bookParam ||
                    b.name === bookParam
            );

            if (book) {
                const chapter = parseInt(chapterParam);
                if (!isNaN(chapter) && chapter > 0 && chapter <= book.chapters) {
                    setSelectedBook(book);
                    setSelectedChapter(chapter);
                    setShowAllContent(true); // 自动切换到阅读模式
                    // 清除 URL 参数
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }
        }
    }, [books]);

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

    // 当选择章节时，重置筛选状态（因为进入了圣经阅读模式）
    useEffect(() => {
        if (selectedChapter) {
            setBookFilter('all');
        }
    }, [selectedChapter]);

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

            // 按书卷筛选
            if (favoritesBookFilter === 'old') {
                favFiltered = favFiltered.filter((v) => {
                    const book = books.find((b) => b.key === v.book || b.nameTraditional === v.book);
                    return book?.testament === 'old';
                });
            } else if (favoritesBookFilter === 'new') {
                favFiltered = favFiltered.filter((v) => {
                    const book = books.find((b) => b.key === v.book || b.nameTraditional === v.book);
                    return book?.testament === 'new';
                });
            } else if (favoritesBookFilter !== 'all') {
                // 具体书卷
                favFiltered = favFiltered.filter((v) => {
                    const book = books.find((b) => b.key === favoritesBookFilter);
                    return v.book === favoritesBookFilter || v.book === book?.nameTraditional;
                });
            }

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

        // 1. 先按书卷筛选
        if (bookFilter === 'old') {
            filtered = verses.filter((v) => {
                const book = books.find((b) => b.key === v.book || b.nameTraditional === v.book);
                return book?.testament === 'old';
            });
        } else if (bookFilter === 'new') {
            filtered = verses.filter((v) => {
                const book = books.find((b) => b.key === v.book || b.nameTraditional === v.book);
                return book?.testament === 'new';
            });
        } else if (bookFilter !== 'all') {
            // 具体书卷
            filtered = verses.filter((v) => v.book === bookFilter || v.book === books.find((b) => b.key === bookFilter)?.nameTraditional);
        }

        // 2. 随机或默认排序
        if (shuffleKey > 0) {
            // 随机模式：完全随机
            const shuffled = [...filtered];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            filtered = shuffled;
        } else {
            // 默认按圣经顺序
            filtered = [...filtered].sort((a, b) => {
                const bookA = books.find((bk) => bk.key === a.book || bk.nameTraditional === a.book);
                const bookB = books.find((bk) => bk.key === b.book || bk.nameTraditional === b.book);
                if (bookA && bookB && bookA.order !== bookB.order) {
                    return bookA.order - bookB.order;
                }
                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                return a.verse - b.verse;
            });
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
        bookFilter,
        favoritesBookFilter,
        books,
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

    // 从侧边栏查看章节（与卡片的实现一致）
    const handleViewChapterFromMenu = (bookName: string, chapter: number) => {
        const book = books.find((b) => b.name === bookName || b.nameTraditional === bookName || b.nameSimplified === bookName || b.key === bookName);

        if (book) {
            setSelectedBook(book);
            setSelectedChapter(chapter);
            setShowAllContent(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 分享收藏功能
    const handleShareFavorites = async () => {
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

            // 立即复制到剪贴板（移动端和桌面端统一处理）
            await navigator.clipboard.writeText(shareUrl);
            setShareToast({
                show: true,
                message: '链接已复制到剪贴板，发送给他人即可查看您的收藏',
            });
        } catch (error) {
            logError('HomePage:handleShareFavorites', error);
            setShareToast({ show: true, message: '复制失败，请稍后重试' });
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

    // 计算收藏筛选选项的经文数量
    const favoritesBookCounts = useMemo(() => {
        const counts = {
            all: favoritesVersesData.length,
            old: 0,
            new: 0,
            books: {} as Record<string, number>,
        };

        favoritesVersesData.forEach((verse) => {
            const book = books.find((b) => b.key === verse.book || b.nameTraditional === verse.book);
            if (book) {
                if (book.testament === 'old') counts.old++;
                if (book.testament === 'new') counts.new++;
                counts.books[book.key] = (counts.books[book.key] || 0) + 1;
            }
        });

        return counts;
    }, [favoritesVersesData, books]);

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
                            {/* 全局统计 - 桌面端（完整信息）*/}
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-gold-200 dark:border-gold-700/30">
                                {statsLoading ? (
                                    <span className="h-4 w-48 bg-gradient-to-r from-bible-200 to-bible-300 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse-slow"></span>
                                ) : (
                                    <span className="text-xs text-bible-700 dark:text-bible-300 whitespace-nowrap font-chinese">
                                        👥 已有 {globalStats.totalUsers.toLocaleString()} 位弟兄姊妹 · ⭐ 共收藏{' '}
                                        {globalStats.totalFavorites.toLocaleString()} 节经文
                                    </span>
                                )}
                            </div>

                            {/* 全局统计 - 平板端（简化，可点击）*/}
                            <button
                                onClick={() => setShowStatsModal(true)}
                                className="hidden md:flex lg:hidden items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-gold-200 dark:border-gold-700/30 hover:shadow-md transition-shadow"
                                title="点击查看详情"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            >
                                {statsLoading ? (
                                    <span className="h-4 w-24 bg-gradient-to-r from-bible-200 to-bible-300 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse-slow"></span>
                                ) : (
                                    <span className="text-xs text-bible-700 dark:text-bible-300 font-chinese">
                                        👥 {globalStats.totalUsers.toLocaleString()} 人 · ⭐ {globalStats.totalFavorites.toLocaleString()} 节
                                    </span>
                                )}
                            </button>

                            {/* 全局统计 - 移动端（紧凑，可点击）*/}
                            <button
                                onClick={() => setShowStatsModal(true)}
                                className="flex md:hidden items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-gold-200 dark:border-gold-700/30 hover:shadow-md transition-shadow"
                                title="查看统计"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            >
                                {statsLoading ? (
                                    <span className="h-4 w-16 bg-gradient-to-r from-bible-200 to-bible-300 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse-slow"></span>
                                ) : (
                                    <span className="text-xs text-bible-700 dark:text-bible-300 font-chinese">
                                        👥 {globalStats.totalUsers.toLocaleString()} · ⭐ {globalStats.totalFavorites.toLocaleString()}
                                    </span>
                                )}
                            </button>

                            {/* 帮助按钮 - 只在平板/桌面端显示 */}
                            <button
                                onClick={handleOpenGuide}
                                className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="显示使用帮助"
                                aria-label="显示使用帮助"
                            >
                                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">帮助</span>
                            </button>

                            {/* 简繁体切换 - 只在平板/桌面端显示 */}
                            <button
                                onClick={() => setLanguage(language === 'simplified' ? 'traditional' : 'simplified')}
                                className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={language === 'simplified' ? '切换到繁体' : '切換到簡體'}
                                aria-label={language === 'simplified' ? '切换到繁体中文' : '切換到簡體中文'}
                            >
                                <Languages className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                                    {language === 'simplified' ? '繁' : '簡'}
                                </span>
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

                            {/* 汉堡菜单按钮 - 移到最右侧 */}
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

                                {/* 返回笔记按钮 - 当从笔记本跳转过来时显示 */}
                                {fromBibleNote && (
                                    <a
                                        href="/bible-note"
                                        className="flex items-center gap-2 px-4 py-2 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors shadow-sm touch-manipulation min-h-[44px]"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="返回聖經筆記本"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="font-chinese text-sm">返回筆記</span>
                                    </a>
                                )}

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
                {showShareBanner && sharedVerses.length > 0 && (
                    <div
                        className="bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800 py-4 transition-all duration-300"
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
                    </div>
                )}

                {/* 分享Toast通知 */}
                {shareToast.show && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md mx-4 animate-fade-in">
                        <div className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 rounded-xl shadow-2xl text-sm font-chinese flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                            <span>{shareToast.message}</span>
                        </div>
                    </div>
                )}

                {/* 侧边栏菜单 */}
                <SideMenu
                    isOpen={showSideMenu}
                    onClose={() => setShowSideMenu(false)}
                    theme={theme}
                    onThemeChange={toggleTheme}
                    onViewChapter={handleViewChapterFromMenu}
                    language={language}
                    onLanguageChange={setLanguage}
                />

                {/* 移动端统计 modal */}
                {showStatsModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStatsModal(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-center text-lg font-semibold text-bible-800 dark:text-bible-200 mb-4 font-chinese">📊 全球統計</h3>
                            <p className="text-center text-sm text-bible-700 dark:text-bible-300 leading-relaxed font-chinese">
                                已有 <span className="font-bold text-bible-900 dark:text-bible-100">{globalStats.totalUsers.toLocaleString()}</span>{' '}
                                位弟兄姊妹在此背誦神的話語
                                <br />
                                共收藏{' '}
                                <span className="font-bold text-bible-900 dark:text-bible-100">
                                    {globalStats.totalFavorites.toLocaleString()}
                                </span>{' '}
                                次經文
                            </p>
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="mt-4 w-full px-4 py-2 bg-bible-500 text-white rounded-lg hover:bg-bible-600 transition-colors font-chinese"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                )}

                {/* 关闭引导提示 - 浮动通知 */}
                {showGuideHint && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md mx-4 animate-fade-in">
                        <div className="p-4 bg-bible-50 dark:bg-gray-800 border-2 border-bible-300 dark:border-gray-600 text-bible-800 dark:text-bible-200 rounded-xl shadow-2xl text-sm font-chinese flex items-center gap-3 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="flex-1">
                                引导已关闭。如需再次查看，请点击右上角的{' '}
                                <span className="font-semibold text-bible-700 dark:text-bible-300">「帮助」</span> 按钮
                            </span>
                            <button
                                onClick={() => setShowGuideHint(false)}
                                className="flex-shrink-0 p-1 hover:bg-bible-100 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
                                title="关闭提示"
                                aria-label="关闭提示"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            >
                                <X className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 使用提示和统计信息 */}
                <div className="max-w-7xl mx-auto px-4 py-3">
                    {/* 引导说明 */}
                    {showGuide && (
                        <div className="mb-3 p-5 bg-gradient-to-br from-bible-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl border-2 border-bible-300/50 dark:border-gray-700 shadow-lg animate-fade-in">
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
                                        {/* 1. 經文選擇 */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">📖</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">經文選擇</p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    <span className="font-semibold">精選 114 節</span>核心經文，或選擇
                                                    <span className="font-semibold">聖經 66 卷</span>任意章節瀏覽。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 2. 背誦功能 */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">🎯</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">背誦模式</p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    <span className="font-semibold">點擊卡片</span>顯示/隱藏經文內容。 點擊
                                                    <span className="font-semibold">眼睛圖標</span>切換閱讀/背誦模式，
                                                    <span className="font-semibold">洗牌按鈕</span>隨機排序。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 3. 遮罩設置 */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">🎨</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">遮罩提示</p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    點擊卡片顯示/隱藏經文內容。支持
                                                    <span className="font-semibold">每句提示</span>/<span className="font-semibold">開頭提示</span>
                                                    兩種模式， 可設置固定或隨機字數，每次點擊隨機顯示不同提示字數。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 4. 收藏分享 */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">⭐</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">收藏分享</p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    點擊<span className="font-semibold">星標</span>收藏經文， 點擊
                                                    <span className="font-semibold">分享按鈕</span>生成鏈接。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 5. 筆記本功能 */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">📝</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">
                                                    筆記本 <span className="px-1.5 py-0.5 text-xs bg-gold-500 text-white rounded-full">BETA</span>
                                                </p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    右上角菜單 → 筆記本，
                                                    <span className="font-semibold">自動補全</span>經文引用，
                                                    <span className="font-semibold">一鍵展開</span>內容，
                                                    <span className="font-semibold">Markdown</span>編輯。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 6. 主題設置 */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">🌓</span>
                                            <div>
                                                <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">主題語言</p>
                                                <p className="text-bible-600 dark:text-bible-400">
                                                    支持<span className="font-semibold">繁簡切換</span>、
                                                    <span className="font-semibold">深色模式</span>（淺色/深色/自動）。
                                                </p>
                                            </div>
                                        </div>

                                        {/* iPhone App 推薦 */}
                                        <div className="mt-3 pt-3 border-t border-bible-200/50 dark:border-gray-700">
                                            <div className="flex items-start gap-2">
                                                <span className="text-base">📱</span>
                                                <div>
                                                    <p className="font-semibold text-bible-800 dark:text-bible-200 mb-0.5">心版 iOS App</p>
                                                    <p className="text-bible-600 dark:text-bible-400">
                                                        將經文以<span className="font-semibold">小組件</span>形式展示在主屏幕，
                                                        每次解鎖第一眼看到神的話語。
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
                        </div>
                    )}

                    {/* 状态标签和统计 */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
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
                        </div>

                        {/* 遮罩设置控制面板 */}
                        <div className="w-full md:w-auto">
                            <MaskSettings />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-bible-500 dark:text-bible-400 font-chinese">
                                共 <span className="font-semibold text-bible-700 dark:text-bible-300">{displayVerses.length}</span> 节
                            </span>

                            {/* 只在精选经文模式下显示筛选按钮 */}
                            {!selectedChapter && filterType !== 'favorites' && !showShareBanner && (
                                <>
                                    {/* 筛选按钮 */}
                                    <Listbox value={bookFilter} onChange={setBookFilter}>
                                        <div className="relative">
                                            <Listbox.Button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bible-50 dark:bg-gray-800 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors">
                                                <Filter className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-xs text-bible-700 dark:text-bible-300 font-chinese">篩選</span>
                                                <ChevronDown className="w-3 h-3 text-bible-500 dark:text-bible-400" />
                                            </Listbox.Button>
                                            <Transition
                                                enter="transition duration-100 ease-out"
                                                enterFrom="transform scale-95 opacity-0"
                                                enterTo="transform scale-100 opacity-100"
                                                leave="transition duration-75 ease-out"
                                                leaveFrom="transform scale-100 opacity-100"
                                                leaveTo="transform scale-95 opacity-0"
                                            >
                                                <Listbox.Options className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 py-1 z-50 scrollbar-thin">
                                                    {/* 全部 / 旧约 / 新约 */}
                                                    <Listbox.Option value="all">
                                                        {({ active, selected }) => (
                                                            <div
                                                                className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                        全部
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            ({verses.length})
                                                                        </span>
                                                                        {selected && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Listbox.Option>

                                                    {/* 计算旧约新约经文数量 */}
                                                    {(() => {
                                                        const oldCount = verses.filter((v) => {
                                                            const book = books.find((b) => b.key === v.book || b.nameTraditional === v.book);
                                                            return book?.testament === 'old';
                                                        }).length;
                                                        const newCount = verses.filter((v) => {
                                                            const book = books.find((b) => b.key === v.book || b.nameTraditional === v.book);
                                                            return book?.testament === 'new';
                                                        }).length;

                                                        return (
                                                            <>
                                                                <Listbox.Option value="old">
                                                                    {({ active, selected }) => (
                                                                        <div
                                                                            className={`px-4 py-2 cursor-pointer ${
                                                                                active ? 'bg-bible-50 dark:bg-gray-700' : ''
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                                    舊約
                                                                                </span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                        ({oldCount})
                                                                                    </span>
                                                                                    {selected && (
                                                                                        <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Listbox.Option>
                                                                <Listbox.Option value="new">
                                                                    {({ active, selected }) => (
                                                                        <div
                                                                            className={`px-4 py-2 cursor-pointer ${
                                                                                active ? 'bg-bible-50 dark:bg-gray-700' : ''
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                                    新約
                                                                                </span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                        ({newCount})
                                                                                    </span>
                                                                                    {selected && (
                                                                                        <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Listbox.Option>
                                                            </>
                                                        );
                                                    })()}

                                                    {/* 分隔线 */}
                                                    <div className="border-t border-bible-200 dark:border-gray-700 my-1" />

                                                    {/* 各书卷 */}
                                                    {books.map((book) => {
                                                        const count = verses.filter(
                                                            (v) => v.book === book.key || v.book === book.nameTraditional
                                                        ).length;
                                                        if (count === 0) return null;

                                                        return (
                                                            <Listbox.Option key={book.key} value={book.key}>
                                                                {({ active, selected }) => (
                                                                    <div
                                                                        className={`px-4 py-2 cursor-pointer ${
                                                                            active ? 'bg-bible-50 dark:bg-gray-700' : ''
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                                {book.nameTraditional}
                                                                            </span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    ({count})
                                                                                </span>
                                                                                {selected && (
                                                                                    <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                                )}
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
                                </>
                            )}

                            {/* 收藏模式下显示筛选按钮 */}
                            {filterType === 'favorites' && favoritesCount > 0 && (
                                <>
                                    {/* 筛选按钮 */}
                                    <Listbox value={favoritesBookFilter} onChange={setFavoritesBookFilter}>
                                        <div className="relative">
                                            <Listbox.Button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bible-50 dark:bg-gray-800 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors">
                                                <Filter className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-xs text-bible-700 dark:text-bible-300 font-chinese">篩選</span>
                                                <ChevronDown className="w-3 h-3 text-bible-500 dark:text-bible-400" />
                                            </Listbox.Button>
                                            <Transition
                                                enter="transition duration-100 ease-out"
                                                enterFrom="transform scale-95 opacity-0"
                                                enterTo="transform scale-100 opacity-100"
                                                leave="transition duration-75 ease-out"
                                                leaveFrom="transform scale-100 opacity-100"
                                                leaveTo="transform scale-95 opacity-0"
                                            >
                                                <Listbox.Options className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 py-1 z-50 scrollbar-thin">
                                                    {/* 全部 / 旧约 / 新约 */}
                                                    <Listbox.Option value="all">
                                                        {({ active, selected }) => (
                                                            <div
                                                                className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                        全部
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            ({favoritesBookCounts.all})
                                                                        </span>
                                                                        {selected && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Listbox.Option>

                                                    <Listbox.Option value="old">
                                                        {({ active, selected }) => (
                                                            <div
                                                                className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                        舊約
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            ({favoritesBookCounts.old})
                                                                        </span>
                                                                        {selected && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Listbox.Option>
                                                    <Listbox.Option value="new">
                                                        {({ active, selected }) => (
                                                            <div
                                                                className={`px-4 py-2 cursor-pointer ${active ? 'bg-bible-50 dark:bg-gray-700' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                        新約
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            ({favoritesBookCounts.new})
                                                                        </span>
                                                                        {selected && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Listbox.Option>

                                                    {/* 分隔线 */}
                                                    <div className="border-t border-bible-200 dark:border-gray-700 my-1" />

                                                    {/* 各书卷 */}
                                                    {books.map((book) => {
                                                        const count = favoritesBookCounts.books[book.key] || 0;
                                                        if (count === 0) return null;

                                                        return (
                                                            <Listbox.Option key={book.key} value={book.key}>
                                                                {({ active, selected }) => (
                                                                    <div
                                                                        className={`px-4 py-2 cursor-pointer ${
                                                                            active ? 'bg-bible-50 dark:bg-gray-700' : ''
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-chinese text-bible-800 dark:text-bible-200">
                                                                                {book.nameTraditional}
                                                                            </span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    ({count})
                                                                                </span>
                                                                                {selected && (
                                                                                    <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                                                )}
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
                                </>
                            )}
                        </div>
                    </div>
                </div>

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
                                    loading="lazy"
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
                                    <button
                                        key={chapterNum}
                                        onClick={() => handleChapterSelect(chapterNum)}
                                        className="aspect-square flex items-center justify-center bg-bible-100 dark:bg-gray-700 text-bible-800 dark:text-bible-200 hover:bg-bible-400 hover:text-white hover:shadow-md rounded-lg font-semibold shadow-sm touch-manipulation transition-all duration-200 hover:scale-105 active:scale-95"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title={`第 ${chapterNum} 章`}
                                    >
                                        {chapterNum}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : displayVerses.length > 0 ? (
                        <>
                            <MasonryLayout
                                key={shuffleKey}
                                verses={displayVerses.slice(0, visibleCount)}
                                defaultRevealed={showAllContent}
                                onViewInBible={handleViewInBible}
                            />
                            {visibleCount < displayVerses.length && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-bible-100 dark:bg-gray-700 rounded-lg">
                                        <div className="w-4 h-4 border-2 border-bible-400 dark:border-bible-300 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm text-bible-600 dark:text-bible-300 font-chinese">
                                            正在加载更多... ({visibleCount} / {displayVerses.length})
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-bible-600 dark:text-bible-400 font-chinese">暂无经文</p>
                        </div>
                    )}
                </div>

                {/* iOS App 推广区块 - Mini版 */}
                {showAppPromo && (
                    <div className="max-w-7xl mx-auto px-4 py-6 mt-4 animate-fade-in">
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
                                                src="/xinban-logo.jpg"
                                                alt="心版 App Logo"
                                                width={64}
                                                height={64}
                                                loading="lazy"
                                                quality={85}
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
                    </div>
                )}

                {/* 页脚 */}
                <footer className="border-t border-bible-200 dark:border-gray-700 mt-12">
                    {/* 全局统计栏 */}
                    <div className="border-b border-bible-200 dark:border-gray-700 bg-bible-50/30 dark:bg-gray-800/30">
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            <p className="text-center text-xs text-bible-600 dark:text-bible-400 mb-2 font-chinese">📊 全球使用數據</p>
                            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm font-chinese">
                                <div className="flex items-center gap-1.5">
                                    <span>👥</span>
                                    <span className="font-bold text-bible-800 dark:text-bible-200">{globalStats.totalUsers.toLocaleString()}</span>
                                    <span className="text-xs text-bible-600 dark:text-bible-400">位用戶</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span>⭐</span>
                                    <span className="font-bold text-gold-600 dark:text-gold-400">{globalStats.totalFavorites.toLocaleString()}</span>
                                    <span className="text-xs text-bible-600 dark:text-bible-400">次收藏</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 font-chinese">
                        <p>願神的話語常在你心中 🙏</p>
                        <p className="mt-2 text-xs">© 2025 你的話語 · Made with ❤️ for Christ</p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
