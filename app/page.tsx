'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Shuffle, Star, X, Eye, EyeOff, Sun, Moon, Monitor, Languages } from 'lucide-react';
import Image from 'next/image';
import { useVerseStore } from '@/stores/useVerseStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Verse, Book } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MasonryLayout from '@/components/verses/MasonryLayout';

type FilterType = 'all' | 'old' | 'new' | 'favorites';

export default function HomePage() {
  const { language, theme, setLanguage, toggleTheme } = useAppStore();
  const { verses, books, loadVerses, loadBooks } = useVerseStore();
  const { isFavorite } = useFavoritesStore();
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

  // 同步主题到 DOM
  useEffect(() => {
    const updateTheme = () => {
      const isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
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
    Promise.all([
      loadVerses('preset', language),
      loadBooks(language)
    ])
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message || '加载数据失败');
        setLoading(false);
      });
  }, [language, loadVerses, loadBooks]);

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

  // 筛选和排序经文
  const displayVerses = useMemo(() => {
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

    // 随机排序
    if (shuffleKey > 0) {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [verses, chapterVerses, filterType, selectedBook, selectedChapter, shuffleKey, isFavorite]);

  const handleShuffle = () => {
    setShuffleKey((prev) => prev + 1);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    setShowFilterMenu(false);
  };

  const handleBookSelect = (book: Book | null) => {
    setSelectedBook(book);
    setSelectedChapter(null);
  };

  const handleChapterSelect = (chapter: number | null) => {
    setSelectedChapter(chapter);
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
    const book = books.find((b) => 
      b.key === verse.bookKey || 
      b.name === verse.book ||
      b.nameSimplified === verse.book ||
      b.nameTraditional === verse.book
    );
    
    if (book) {
      setSelectedBook(book);
      setSelectedChapter(verse.chapter);
      setShowAllContent(true); // 跳转到原文时自动切换到阅读模式
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
                  <Image
                    src="/logo.png"
                    alt="你的話語 Logo"
                    width={40}
                    height={40}
                    className="w-8 h-8 md:w-10 md:h-10"
                  />
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
                      <span>精選經文</span>
                    </>
                  )}
                </span>
              </div>
            </div>

                    <div className="flex items-center gap-2">
                      {/* 简繁体切换 */}
                      <button
                        onClick={() => setLanguage(language === 'simplified' ? 'traditional' : 'simplified')}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
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
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
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
                          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-600 dark:bg-bible-500 text-white hover:bg-bible-700 dark:hover:bg-bible-600 rounded-lg transition-colors"
                          title="返回精选经文"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline font-chinese text-sm">返回</span>
                        </button>
                      )}

                      {/* 阅读/背诵模式切换（始终显示） */}
                      <button
                        onClick={() => setShowAllContent(!showAllContent)}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title={showAllContent ? '切换到背诵模式' : '切换到阅读模式'}
                      >
                        {showAllContent ? (
                          <>
                            <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                            <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                              背诵
                            </span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                            <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                              阅读
                            </span>
                          </>
                        )}
                      </button>
                    </div>
          </div>

          {/* 筛选工具栏 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 已收藏筛选 */}
            {!selectedBook && (
              <button
                onClick={() => setFilterType(filterType === 'favorites' ? 'all' : 'favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm ${
                  filterType === 'favorites'
                    ? 'bg-gold-500 dark:bg-gold-600 text-white hover:bg-gold-600 dark:hover:bg-gold-700'
                    : 'bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 text-bible-700 dark:text-bible-300 border border-bible-200 dark:border-gray-700'
                }`}
                title={filterType === 'favorites' ? '显示全部' : '只看已收藏'}
              >
                <Star className={`w-4 h-4 ${filterType === 'favorites' ? 'fill-white' : ''}`} />
                <span className="hidden sm:inline font-chinese text-sm">
                  {filterType === 'favorites' ? '已收藏' : '收藏'}
                </span>
              </button>
            )}

            {/* 书卷选择器 */}
            <select
              value={selectedBook?.key || ''}
              onChange={(e) => {
                const book = books.find((b) => b.key === e.target.value);
                handleBookSelect(book || null);
              }}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm font-chinese text-base md:text-sm text-bible-700 dark:text-bible-300 cursor-pointer"
            >
              <option value="">选择书卷</option>
              <optgroup label="旧约">
                {books.filter((b) => b.testament === 'old').map((book) => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="新约">
                {books.filter((b) => b.testament === 'new').map((book) => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* 章节选择器 */}
            {selectedBook && (
              <select
                value={selectedChapter || ''}
                onChange={(e) => handleChapterSelect(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm font-chinese text-base md:text-sm text-bible-700 dark:text-bible-300 cursor-pointer"
              >
                <option value="">所有章节</option>
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                  <option key={ch} value={ch}>
                    第 {ch} 章
                  </option>
                ))}
              </select>
            )}

            {/* 随机按钮 */}
            {!selectedChapter && (
              <button
                onClick={handleShuffle}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-bible-200 dark:border-gray-700 shadow-sm"
                title="重新排列"
              >
                <Shuffle className="w-4 h-4 text-bible-700 dark:text-bible-300" />
                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                  随机
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 筛选状态和统计信息 */}
      <motion.div
        className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
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
      </motion.div>

      {/* 经文卡片区域 */}
      <div className="max-w-7xl mx-auto">
        {loadingChapter ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-bible-600 dark:text-bible-400 font-chinese">加载经文中...</p>
          </div>
                ) : selectedBook && selectedChapter === null ? (
                  // 选择了书卷但未选择章节，显示提示
                  <div className="text-center py-20 px-4">
                    <Image
                      src="/logo.png"
                      alt="你的話語"
                      width={64}
                      height={64}
                      className="w-16 h-16 mx-auto mb-4 opacity-60"
                    />
                    <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 mb-2 font-chinese">
                      请选择章节
                    </h3>
                    <p className="text-bible-600 dark:text-bible-400 font-chinese">
                      {selectedBook.name} 共有 {selectedBook.chapters} 章，请在上方选择要查看的章节
                    </p>
                  </div>
                ) : displayVerses.length > 0 ? (
          <MasonryLayout
            key={shuffleKey}
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
