'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { getChapter, getBookMetadata } from '@/lib/verseLoader';

interface ChapterViewerProps {
    isOpen: boolean;
    onClose: () => void;
    book: string;
    chapter: number;
    onInsertVerses: (verses: Array<{ book: string; chapter: number; verse: number; text: string }>) => void;
    onChapterChange?: (book: string, chapter: number) => void;
}

export default function ChapterViewer({ isOpen, onClose, book, chapter, onInsertVerses, onChapterChange }: ChapterViewerProps) {
    const [verses, setVerses] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [isInserting, setIsInserting] = useState(false);
    const [bookDisplayName, setBookDisplayName] = useState('');
    const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
    const [allBooks, setAllBooks] = useState<any[]>([]);
    const [currentBook, setCurrentBook] = useState(book);
    const [currentChapter, setCurrentChapter] = useState(chapter);
    const [maxChapter, setMaxChapter] = useState(1);

    // 初始化：加载所有书卷数据
    useEffect(() => {
        if (!isOpen) return;

        getBookMetadata()
            .then((books) => {
                setAllBooks(books);
            })
            .catch((error) => {
                console.error('Error loading books:', error);
            });
    }, [isOpen]);

    // 同步外部 props 变化
    useEffect(() => {
        if (isOpen) {
            setCurrentBook(book);
            setCurrentChapter(chapter);
        }
    }, [isOpen, book, chapter]);

    // 加载章节内容
    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setSelectedVerses(new Set()); // 切换章节时清空选择

        // 加载书卷元数据
        getBookMetadata(currentBook)
            .then((bookData) => {
                if (bookData) {
                    setBookDisplayName(bookData.nameTraditional || currentBook);
                    setMaxChapter(bookData.chapters || 1);
                }
            })
            .catch((error) => {
                console.error('Error loading book metadata:', error);
            });

        // 加载章节经文
        getChapter(currentBook, currentChapter)
            .then((data) => {
                setVerses(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error loading chapter:', error);
                setLoading(false);
            });
    }, [isOpen, currentBook, currentChapter]);

    // ESC 键关闭
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    // 报告章节变化
    useEffect(() => {
        if (isOpen && onChapterChange && currentBook && currentChapter) {
            onChapterChange(currentBook, currentChapter);
        }
    }, [isOpen, currentBook, currentChapter, onChapterChange]);

    // 导航处理函数
    const handlePrevChapter = useCallback(() => {
        if (currentChapter > 1) {
            setCurrentChapter(currentChapter - 1);
        } else {
            // 跳到上一本书的最后一章
            const currentBookIndex = allBooks.findIndex((b) => b.key === currentBook);
            if (currentBookIndex > 0) {
                const prevBook = allBooks[currentBookIndex - 1];
                setCurrentBook(prevBook.key);
                setCurrentChapter(prevBook.chapters);
            }
        }
    }, [currentChapter, currentBook, allBooks]);

    const handleNextChapter = useCallback(() => {
        if (currentChapter < maxChapter) {
            setCurrentChapter(currentChapter + 1);
        } else {
            // 跳到下一本书的第一章
            const currentBookIndex = allBooks.findIndex((b) => b.key === currentBook);
            if (currentBookIndex < allBooks.length - 1) {
                const nextBook = allBooks[currentBookIndex + 1];
                setCurrentBook(nextBook.key);
                setCurrentChapter(1);
            }
        }
    }, [currentChapter, maxChapter, currentBook, allBooks]);

    const handleBookChange = useCallback((newBook: string) => {
        setCurrentBook(newBook);
        setCurrentChapter(1);
    }, []);

    const handleChapterChange = useCallback((newChapter: number) => {
        setCurrentChapter(newChapter);
    }, []);

    // 选择/取消选择经文
    const handleToggleVerse = useCallback((verseNum: number) => {
        setSelectedVerses((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(verseNum)) {
                newSet.delete(verseNum);
            } else {
                newSet.add(verseNum);
            }
            return newSet;
        });
    }, []);

    // 清空选择
    const handleClearSelection = useCallback(() => {
        setSelectedVerses(new Set());
    }, []);

    // 插入单节经文
    const handleInsertSingle = useCallback(
        (verseNum: number, verseText: string) => {
            setIsInserting(true);
            onInsertVerses([
                {
                    book: currentBook,
                    chapter: currentChapter,
                    verse: verseNum,
                    text: verseText,
                },
            ]);
            setTimeout(() => setIsInserting(false), 500);
        },
        [currentBook, currentChapter, onInsertVerses]
    );

    // 插入选中的经文
    const handleInsertSelected = useCallback(() => {
        if (selectedVerses.size === 0) return;

        setIsInserting(true);

        const versesToInsert = Array.from(selectedVerses)
            .sort((a, b) => a - b)
            .map((verseNum) => ({
                book: currentBook,
                chapter: currentChapter,
                verse: verseNum,
                text: verses[verseNum],
            }));

        onInsertVerses(versesToInsert);

        // 清空选择
        setSelectedVerses(new Set());
        setTimeout(() => setIsInserting(false), 500);
    }, [selectedVerses, currentBook, currentChapter, verses, onInsertVerses]);

    const canGoPrev = currentChapter > 1 || allBooks.findIndex((b) => b.key === currentBook) > 0;
    const canGoNext = currentChapter < maxChapter || allBooks.findIndex((b) => b.key === currentBook) < allBooks.length - 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 背景遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
                        onClick={onClose}
                    />

                    {/* 浮动面板 */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[60vh] md:max-h-[70vh] flex flex-col"
                    >
                        {/* 头部 - 导航控制 */}
                        <div className="flex flex-col gap-2 p-2 md:p-4 border-b border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-900">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* 书卷选择器 */}
                                    <Listbox value={currentBook} onChange={handleBookChange}>
                                        <div className="relative">
                                            <Listbox.Button className="min-h-[40px] md:min-h-[44px] px-2.5 md:px-3 py-1.5 md:py-2 bg-white dark:bg-gray-700 border border-bible-300 dark:border-gray-600 rounded-lg text-xs md:text-sm font-chinese text-bible-800 dark:text-bible-200 hover:bg-bible-50 dark:hover:bg-gray-600 transition-colors touch-manipulation">
                                                {bookDisplayName || currentBook}
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-48 overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {allBooks.map((book) => (
                                                        <Listbox.Option
                                                            key={book.key}
                                                            value={book.key}
                                                            className={({ active }) =>
                                                                `min-h-[40px] md:min-h-[44px] cursor-pointer select-none px-3 md:px-4 py-1.5 md:py-2 font-chinese text-xs md:text-sm ${
                                                                    active
                                                                        ? 'bg-bible-100 dark:bg-gray-600 text-bible-900 dark:text-bible-100'
                                                                        : 'text-bible-700 dark:text-bible-300'
                                                                }`
                                                            }
                                                        >
                                                            {book.nameTraditional}
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>

                                    {/* 章节选择器 */}
                                    <Listbox value={currentChapter} onChange={handleChapterChange}>
                                        <div className="relative">
                                            <Listbox.Button className="min-h-[44px] min-w-[60px] px-3 py-2 bg-white dark:bg-gray-700 border border-bible-300 dark:border-gray-600 rounded-lg text-sm md:text-base font-chinese text-bible-800 dark:text-bible-200 hover:bg-bible-50 dark:hover:bg-gray-600 transition-colors touch-manipulation">
                                                第 {currentChapter} 章
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-32 overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {Array.from({ length: maxChapter }, (_, i) => i + 1).map((ch) => (
                                                        <Listbox.Option
                                                            key={ch}
                                                            value={ch}
                                                            className={({ active }) =>
                                                                `min-h-[40px] md:min-h-[44px] cursor-pointer select-none px-3 md:px-4 py-1.5 md:py-2 font-chinese text-xs md:text-sm ${
                                                                    active
                                                                        ? 'bg-bible-100 dark:bg-gray-600 text-bible-900 dark:text-bible-100'
                                                                        : 'text-bible-700 dark:text-bible-300'
                                                                }`
                                                            }
                                                        >
                                                            第 {ch} 章
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>

                                    {/* 上一章/下一章按钮 */}
                                    <button
                                        onClick={handlePrevChapter}
                                        disabled={!canGoPrev}
                                        className="min-h-[44px] min-w-[44px] p-2 bg-bible-100 hover:bg-bible-200 disabled:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 rounded-lg transition-colors touch-manipulation"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="上一章"
                                        aria-label="上一章"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-bible-700 dark:text-bible-300" />
                                    </button>
                                    <button
                                        onClick={handleNextChapter}
                                        disabled={!canGoNext}
                                        className="min-h-[44px] min-w-[44px] p-2 bg-bible-100 hover:bg-bible-200 disabled:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 rounded-lg transition-colors touch-manipulation"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="下一章"
                                        aria-label="下一章"
                                    >
                                        <ChevronRight className="w-5 h-5 text-bible-700 dark:text-bible-300" />
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="min-h-[44px] min-w-[44px] p-2 hover:bg-bible-200 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    title="關閉"
                                    aria-label="關閉章節查看器"
                                >
                                    <X className="w-6 h-6 text-bible-600 dark:text-bible-400" />
                                </button>
                            </div>

                            <p className="text-xs md:text-sm text-bible-600 dark:text-bible-400 font-chinese">{Object.keys(verses).length} 節經文</p>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 overflow-y-auto p-2 md:p-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-bible-600 dark:text-bible-400" />
                                    <span className="ml-3 text-bible-600 dark:text-bible-400 font-chinese text-sm md:text-base">加載中...</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(verses)
                                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                        .map(([verseNum, verseText]) => {
                                            const num = parseInt(verseNum);
                                            const isSelected = selectedVerses.has(num);
                                            return (
                                                <motion.div
                                                    key={verseNum}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2, delay: num * 0.01 }}
                                                    className={`min-h-[56px] p-2.5 md:p-3 bg-bible-50 dark:bg-gray-700 rounded-lg border-2 transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'border-bible-500 dark:border-bible-400 bg-bible-100 dark:bg-gray-600'
                                                            : 'border-bible-200 dark:border-gray-600'
                                                    }`}
                                                    onClick={(e) => {
                                                        // 只有当点击的不是插入按钮时才切换选中状态
                                                        if ((e.target as HTMLElement).closest('button[data-action="insert"]')) {
                                                            return;
                                                        }
                                                        handleToggleVerse(num);
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* 复选框 */}
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="mt-1 w-5 h-5 md:w-4 md:h-4 rounded border-bible-300 text-bible-500 focus:ring-bible-500 pointer-events-none"
                                                            aria-label={`選擇第 ${verseNum} 節`}
                                                        />

                                                        {/* 节数标记 */}
                                                        <span className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-bible-500 text-white rounded-full text-xs md:text-sm font-semibold">
                                                            {verseNum}
                                                        </span>

                                                        {/* 经文内容 */}
                                                        <p className="flex-1 text-bible-800 dark:text-bible-100 font-chinese text-xs md:text-sm leading-relaxed">
                                                            {verseText}
                                                        </p>

                                                        {/* 插入按钮 */}
                                                        <button
                                                            data-action="insert"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleInsertSingle(num, verseText);
                                                            }}
                                                            disabled={isInserting}
                                                            className="flex-shrink-0 min-h-[44px] min-w-[44px] md:min-w-0 md:px-3 py-2 bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 text-white rounded-lg transition-colors shadow-sm touch-manipulation flex items-center justify-center gap-1"
                                                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                                            title="插入此節"
                                                            aria-label="插入此節"
                                                        >
                                                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                                            <span className="hidden md:inline text-xs font-chinese">插入</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* 底部操作栏 */}
                        <div className="min-h-[52px] p-2.5 md:p-3 border-t border-bible-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-3">
                            {/* 左侧：选择提示 */}
                            <div className="text-xs md:text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                {selectedVerses.size > 0 ? `已選 ${selectedVerses.size} 節` : '點擊 ☑️ 多選'}
                            </div>

                            {/* 右侧：操作按钮 */}
                            <div className="flex gap-2">
                                {selectedVerses.size > 0 && (
                                    <>
                                        <button
                                            onClick={handleClearSelection}
                                            className="min-h-[44px] px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-bible-700 dark:text-bible-300 rounded-lg transition-colors font-chinese text-xs md:text-sm touch-manipulation"
                                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={handleInsertSelected}
                                            disabled={isInserting}
                                            className="min-h-[44px] px-3 md:px-4 py-2 bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 text-white rounded-lg transition-colors shadow-sm font-chinese text-xs md:text-sm touch-manipulation flex items-center gap-1"
                                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        >
                                            {isInserting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>插入選中 ({selectedVerses.size})</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
