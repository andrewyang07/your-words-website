'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Shuffle, Star, X, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useVerseStore } from '@/stores/useVerseStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Verse, Book } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MasonryLayout from '@/components/verses/MasonryLayout';

type FilterType = 'all' | 'old' | 'new' | 'favorites';

export default function HomePage() {
  const { language } = useAppStore();
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

    // 否则显示精选经文（筛选后）
    let filtered = [...verses];

    // 应用约/卷筛选
    switch (filterType) {
      case 'old':
        filtered = filtered.filter((v) => v.testament === 'old');
        break;
      case 'new':
        filtered = filtered.filter((v) => v.testament === 'new');
        break;
      case 'favorites':
        filtered = filtered.filter((v) => isFavorite(v.id));
        break;
      default:
        break;
    }

    // 应用书卷筛选（但不选择章节时）
    if (selectedBook && selectedChapter === null) {
      filtered = filtered.filter((v) => 
        v.bookKey === selectedBook.key || v.book === selectedBook.name
      );
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filterOptions = [
    { type: 'all' as FilterType, label: '全部', count: verses.length },
    {
      type: 'old' as FilterType,
      label: '旧约',
      count: verses.filter((v) => v.testament === 'old').length,
    },
    {
      type: 'new' as FilterType,
      label: '新约',
      count: verses.filter((v) => v.testament === 'new').length,
    },
    {
      type: 'favorites' as FilterType,
      label: '已收藏',
      count: verses.filter((v) => isFavorite(v.id)).length,
      icon: Star,
    },
  ];

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
            <h1 className="text-2xl md:text-3xl font-bold text-bible-900 dark:text-bible-100 font-chinese flex items-center gap-2">
              <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
              Your Words
            </h1>

            {/* 阅读/背诵模式切换 */}
            {selectedChapter !== null && (
              <button
                onClick={() => setShowAllContent(!showAllContent)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
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
            )}
          </div>

          {/* 筛选工具栏 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 清除筛选按钮 */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 py-2 bg-bible-600 dark:bg-bible-500 text-white hover:bg-bible-700 dark:hover:bg-bible-600 rounded-lg transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                <span className="font-chinese">清除筛选</span>
              </button>
            )}

            {/* 书卷选择器 */}
            <select
              value={selectedBook?.key || ''}
              onChange={(e) => {
                const book = books.find((b) => b.key === e.target.value);
                handleBookSelect(book || null);
              }}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-bible-200 dark:border-gray-600 rounded-lg font-chinese text-sm text-bible-800 dark:text-bible-200"
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
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-bible-200 dark:border-gray-600 rounded-lg font-chinese text-sm text-bible-800 dark:text-bible-200"
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
                className="flex items-center gap-2 px-3 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="重新排列"
              >
                <Shuffle className="w-4 h-4 text-bible-700 dark:text-bible-300" />
                <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">
                  随机
                </span>
              </button>
            )}

            {/* 约/卷筛选 */}
            {!selectedBook && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    filterType !== 'all'
                      ? 'bg-gold-500 dark:bg-gold-600 text-white'
                      : 'bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 text-bible-700 dark:text-bible-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline font-chinese text-sm">筛选</span>
                </button>

                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 z-20"
                    >
                      {filterOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.type}
                            onClick={() => handleFilterChange(option.type)}
                            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-bible-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              filterType === option.type ? 'bg-bible-100 dark:bg-gray-700' : ''
                            }`}
                          >
                            <span className="flex items-center gap-2 font-chinese text-sm">
                              {Icon && <Icon className="w-4 h-4 text-gold-500" />}
                              <span className="text-bible-800 dark:text-bible-200">{option.label}</span>
                            </span>
                            <span className="text-xs text-bible-500 dark:text-bible-400">
                              {option.count}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 当前筛选标签 */}
      {(filterType !== 'all' || selectedBook || selectedChapter !== null) && (
        <motion.div
          className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-sm text-bible-600 dark:text-bible-400 font-chinese">当前筛选：</span>
          
          {filterType !== 'all' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded-full text-xs">
              {filterOptions.find((opt) => opt.type === filterType)?.label}
            </span>
          )}

          {selectedBook && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-bible-100 dark:bg-gray-700 text-bible-700 dark:text-bible-300 rounded-full text-xs font-chinese">
              {selectedBook.name}
              {selectedChapter !== null && ` 第${selectedChapter}章`}
            </span>
          )}

          <span className="text-sm text-bible-500 dark:text-bible-400 font-chinese">
            共 {displayVerses.length} 节
          </span>
        </motion.div>
      )}

      {/* 经文卡片区域 */}
      <div className="max-w-7xl mx-auto">
        {loadingChapter ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-bible-600 dark:text-bible-400 font-chinese">加载经文中...</p>
          </div>
        ) : displayVerses.length > 0 ? (
          <MasonryLayout
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
