'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useVerseStore } from '@/stores/useVerseStore';
import { Book, Verse } from '@/types/verse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import BookSelector from '@/components/study/chapter/BookSelector';
import ChapterSelector from '@/components/study/chapter/ChapterSelector';
import VerseList from '@/components/study/chapter/VerseList';

export default function ChapterModePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { books, loadBooks } = useVerseStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // 加载书卷列表
  useEffect(() => {
    loadBooks()
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message || '加载书卷列表失败');
        setLoading(false);
      });
  }, [loadBooks]);

  // 处理 URL 参数，自动选择书卷和章节
  useEffect(() => {
    if (books.length === 0) return;

    const bookParam = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');

    if (bookParam && !selectedBook) {
      const book = books.find((b) => b.name === bookParam);
      if (book) {
        setSelectedBook(book);
      }
    }

    if (chapterParam && selectedBook && !selectedChapter) {
      const chapter = parseInt(chapterParam, 10);
      if (!isNaN(chapter) && chapter > 0 && chapter <= selectedBook.chapters) {
        setSelectedChapter(chapter);
      }
    }
  }, [books, searchParams, selectedBook, selectedChapter]);

  // 当选择章节时加载经文
  useEffect(() => {
    if (!selectedBook || selectedChapter === null) {
      setChapterVerses([]);
      return;
    }

    setLoadingVerses(true);
    // TODO: 从圣经 JSON 数据中加载对应章节的经文
    // 这里暂时用模拟数据
    setTimeout(() => {
      const mockVerses: Verse[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${selectedBook.id}-${selectedChapter}-${i + 1}`,
        book: selectedBook.name,
        chapter: selectedChapter,
        verse: i + 1,
        text: `这是 ${selectedBook.name} ${selectedChapter}:${i + 1} 的经文内容...`,
        testament: selectedBook.testament,
      }));
      setChapterVerses(mockVerses);
      setLoadingVerses(false);
    }, 300);
  }, [selectedBook, selectedChapter]);

  const handleBack = () => {
    router.push('/');
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setChapterVerses([]);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
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

          <h1 className="text-xl md:text-2xl font-bold text-bible-900 dark:text-bible-100 font-chinese flex items-center gap-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            逐节背诵
          </h1>

          <div className="w-20"></div>
        </div>
      </div>

      {/* 面包屑导航 */}
      {(selectedBook || selectedChapter) && (
        <motion.div
          className="max-w-7xl mx-auto px-4 py-3 md:py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2 text-sm text-bible-600 dark:text-bible-400 font-chinese">
            <button
              onClick={() => {
                setSelectedBook(null);
                setSelectedChapter(null);
              }}
              className="hover:text-bible-800 dark:hover:text-bible-200"
            >
              选择书卷
            </button>
            {selectedBook && (
              <>
                <span>/</span>
                <button
                  onClick={() => setSelectedChapter(null)}
                  className="hover:text-bible-800 dark:hover:text-bible-200"
                >
                  {selectedBook.name}
                </button>
              </>
            )}
            {selectedChapter !== null && (
              <>
                <span>/</span>
                <span className="text-bible-800 dark:text-bible-200 font-bold">
                  第 {selectedChapter} 章
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedBook ? (
          // 步骤1: 选择书卷
          <BookSelector
            books={books}
            selectedBook={selectedBook}
            onSelectBook={handleBookSelect}
          />
        ) : !selectedChapter ? (
          // 步骤2: 选择章节
          <ChapterSelector
            book={selectedBook}
            selectedChapter={selectedChapter}
            onSelectChapter={handleChapterSelect}
          />
        ) : (
          // 步骤3: 显示经文列表
          <>
            {loadingVerses ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-bible-300 dark:border-gray-600 border-t-bible-600 dark:border-t-bible-400 rounded-full animate-spin"></div>
                <p className="mt-4 text-bible-600 dark:text-bible-400 font-chinese">
                  加载经文中...
                </p>
              </div>
            ) : (
              <VerseList
                verses={chapterVerses}
                book={selectedBook.name}
                chapter={selectedChapter}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

