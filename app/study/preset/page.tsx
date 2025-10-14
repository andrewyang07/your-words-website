'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Filter, Shuffle, Star, X } from 'lucide-react';
import { useVerseStore } from '@/stores/useVerseStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MasonryLayout from '@/components/verses/MasonryLayout';

type FilterType = 'all' | 'old' | 'new' | 'favorites';

export default function PresetModePage() {
  const router = useRouter();
  const { language } = useAppStore();
  const { verses, loadVerses } = useVerseStore();
  const { isFavorite } = useFavoritesStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  // 加载预设经文
  useEffect(() => {
    loadVerses('preset', language)
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '加载经文失败');
        setLoading(false);
      });
  }, [language, loadVerses]);

  // 筛选和排序经文
  const filteredVerses = useMemo(() => {
    let filtered = [...verses];

    // 应用筛选
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

    // 随机排序（使用 shuffleKey 触发重新排序）
    if (shuffleKey > 0) {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [verses, filterType, shuffleKey, isFavorite]);

  const handleBack = () => {
    router.push('/');
  };

  const handleViewInBible = (verse: Verse) => {
    router.push(`/study/chapter?book=${encodeURIComponent(verse.book)}&chapter=${verse.chapter}`);
  };

  const handleShuffle = () => {
    setShuffleKey((prev) => prev + 1);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    setShowFilterMenu(false);
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

  if (loading) return <LoadingSpinner />;
  if (error)
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bible-50 to-bible-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-bible-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-bible-700 dark:text-bible-300 hover:text-bible-900 dark:hover:text-bible-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-chinese">返回</span>
          </button>

          <h1 className="text-xl md:text-2xl font-bold text-bible-900 dark:text-bible-100 font-chinese">
            精选经文
          </h1>

          <div className="flex items-center gap-2">
            {/* 重新排列按钮 */}
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="重新排列"
            >
              <Shuffle className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
              <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm md:text-base">
                随机
              </span>
            </button>

            {/* 筛选按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors ${
                  filterType !== 'all'
                    ? 'bg-gold-500 dark:bg-gold-600 text-white'
                    : 'bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 text-bible-700 dark:text-bible-300'
                }`}
              >
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline font-chinese text-sm md:text-base">
                  筛选
                </span>
              </button>

              {/* 筛选下拉菜单 */}
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
                            filterType === option.type
                              ? 'bg-bible-100 dark:bg-gray-700'
                              : ''
                          }`}
                        >
                          <span className="flex items-center gap-2 font-chinese text-sm">
                            {Icon && <Icon className="w-4 h-4 text-gold-500" />}
                            <span className="text-bible-800 dark:text-bible-200">
                              {option.label}
                            </span>
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
          </div>
        </div>
      </div>

      {/* 经文统计和当前筛选 */}
      <motion.div
        className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm md:text-base text-bible-600 dark:text-bible-400 font-chinese">
          {filterType !== 'all' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded-full text-xs mr-2">
              {filterOptions.find((opt) => opt.type === filterType)?.label}
              <button
                onClick={() => setFilterType('all')}
                className="hover:bg-gold-200 dark:hover:bg-gold-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          共 {filteredVerses.length} 节经文
        </p>
      </motion.div>

      {/* 经文网格 */}
      {filteredVerses.length > 0 ? (
        <MasonryLayout verses={filteredVerses} onViewInBible={handleViewInBible} />
      ) : (
        <div className="text-center py-20">
          <p className="text-bible-600 dark:text-bible-400 font-chinese">暂无经文</p>
        </div>
      )}
    </div>
  );
}
