'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { useVerseStore } from '@/stores/useVerseStore';
import { useFilterStore } from '@/stores/useFilterStore';
import MasonryLayout from '@/components/verses/MasonryLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Verse } from '@/types/verse';
import { filterVerses, shuffleArray, sortByOrder } from '@/lib/utils';
import { ArrowLeft, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PresetModePage() {
  const router = useRouter();
  const { language, setLoading, loading } = useAppStore();
  const { verses, loadVerses, setFilteredVerses, filteredVerses } =
    useVerseStore();
  const { testament, sortBy } = useFilterStore();
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadVerses('preset', language);
      } catch (err) {
        setError('加载经文失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [language, loadVerses, setLoading]);

  // 应用筛选和排序
  useEffect(() => {
    if (verses.length === 0) return;

    let filtered = filterVerses(verses, { testament });

    // 排序
    if (sortBy === 'random') {
      filtered = shuffleArray(filtered);
    } else {
      filtered = sortByOrder(filtered);
    }

    setFilteredVerses(filtered);
  }, [verses, testament, sortBy, setFilteredVerses]);

  const handleViewInBible = (verse: Verse) => {
    // TODO: 跳转到圣经阅读界面
    console.log('查看原文:', verse);
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

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

          <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
            <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm md:text-base">筛选</span>
          </button>
        </div>
      </div>

      {/* 经文统计 */}
      <motion.div
        className="max-w-7xl mx-auto px-4 py-3 md:py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm md:text-base text-bible-600 dark:text-bible-400 font-chinese">
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

