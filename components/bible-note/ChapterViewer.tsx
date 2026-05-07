'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { getChapter, getBookMetadata } from '@/lib/verseLoader';

interface ChapterViewerProps {
    isOpen: boolean;
    onClose: () => void;
    book: string;
    chapter: number;
    targetVerse?: number;
    onInsertVerses: (verses: Array<{ book: string; chapter: number; verse: number; text: string }>) => void;
    onChapterChange?: (book: string, chapter: number) => void;
}

export default function ChapterViewer({ isOpen, onClose, book, chapter, targetVerse, onInsertVerses, onChapterChange }: ChapterViewerProps) {
    const [verses, setVerses] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [isInserting, setIsInserting] = useState(false);
    const [bookDisplayName, setBookDisplayName] = useState(book);
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
                } else {
                    // fallback 到 currentBook
                    setBookDisplayName(currentBook);
                }
            })
            .catch((error) => {
                console.error('Error loading book metadata:', error);
                // fallback 到 currentBook
                setBookDisplayName(currentBook);
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

    // 打开引用整章时定位到触发经文
    useEffect(() => {
        if (!isOpen || loading || !targetVerse) return;
        const timer = window.setTimeout(() => {
            document.getElementById(`chapter-verse-${targetVerse}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 80);
        return () => window.clearTimeout(timer);
    }, [isOpen, loading, targetVerse, verses]);

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
                    {/* 浮动面板 - Split View 模式 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[45vh] bottom-0 left-0 right-0 z-[300] overflow-visible rounded-t-[1.75rem] border-t border-stone-900/10 bg-[#fbfaf7]/96 shadow-[0_-18px_54px_rgba(68,64,60,0.13)] backdrop-blur-2xl dark:border-amber-200/10 dark:bg-[#17130f]/96 flex flex-col"
                    >
                        {/* 头部 - 导航控制 */}
                        <div className="flex flex-col gap-2 border-b border-stone-900/10 bg-white/45 p-3 dark:border-amber-200/10 dark:bg-[#211b13]/70 md:p-4">
                            <div className="mx-auto h-1 w-10 rounded-full bg-stone-300/80 dark:bg-stone-700" />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="relative z-[320] flex flex-wrap items-center gap-2 overflow-visible">
                                    {/* 书卷选择器 */}
                                    <Listbox value={currentBook} onChange={handleBookChange}>
                                        <div className="relative z-[330] overflow-visible">
                                            <Listbox.Button className="min-h-[40px] md:min-h-[44px] rounded-full border border-stone-900/10 bg-white/70 px-3 py-1.5 font-chinese text-xs text-stone-800 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-100 dark:hover:bg-white/[0.1] md:text-sm">
                                                {bookDisplayName || currentBook}
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-[9999] mt-2 max-h-[min(24rem,60vh)] w-48 overflow-auto rounded-2xl border border-stone-900/10 bg-white py-1 shadow-[0_24px_70px_rgba(68,64,60,0.24)] ring-1 ring-black/5 focus:outline-none dark:border-white/10 dark:bg-gray-950 scrollbar-thin">
                                                    {allBooks.map((book) => (
                                                        <Listbox.Option
                                                            key={book.key}
                                                            value={book.key}
                                                            className={({ active }) =>
                                                                `min-h-[40px] cursor-pointer select-none px-3 py-1.5 font-chinese text-xs md:min-h-[44px] md:px-4 md:py-2 md:text-sm ${
                                                                    active
                                                                        ? 'bg-stone-100 text-stone-950 dark:bg-white/[0.08] dark:text-stone-100'
                                                                        : 'text-stone-700 dark:text-stone-300'
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
                                        <div className="relative z-[330] overflow-visible">
                                            <Listbox.Button className="min-h-[40px] min-w-[60px] rounded-full border border-stone-900/10 bg-white/70 px-3 py-1.5 font-chinese text-sm text-stone-800 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-100 dark:hover:bg-white/[0.1] md:min-h-[44px] md:text-base">
                                                第 {currentChapter} 章
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-[9999] mt-2 max-h-[min(24rem,60vh)] w-32 overflow-auto rounded-2xl border border-stone-900/10 bg-white py-1 shadow-[0_24px_70px_rgba(68,64,60,0.24)] ring-1 ring-black/5 focus:outline-none dark:border-white/10 dark:bg-gray-950 scrollbar-thin">
                                                    {Array.from({ length: maxChapter }, (_, i) => i + 1).map((ch) => (
                                                        <Listbox.Option
                                                            key={ch}
                                                            value={ch}
                                                            className={({ active }) =>
                                                                `min-h-[40px] cursor-pointer select-none px-3 py-1.5 font-chinese text-xs md:min-h-[44px] md:px-4 md:py-2 md:text-sm ${
                                                                    active
                                                                        ? 'bg-stone-100 text-stone-950 dark:bg-white/[0.08] dark:text-stone-100'
                                                                        : 'text-stone-700 dark:text-stone-300'
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
                                        className="min-h-[40px] min-w-[40px] rounded-full border border-stone-900/10 bg-white/60 p-2 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] md:min-h-[44px] md:min-w-[44px]"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="上一章"
                                        aria-label="上一章"
                                    >
                                        <ChevronLeft className="h-5 w-5 text-stone-600 dark:text-stone-300" />
                                    </button>
                                    <button
                                        onClick={handleNextChapter}
                                        disabled={!canGoNext}
                                        className="min-h-[40px] min-w-[40px] rounded-full border border-stone-900/10 bg-white/60 p-2 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] md:min-h-[44px] md:min-w-[44px]"
                                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        title="下一章"
                                        aria-label="下一章"
                                    >
                                        <ChevronRight className="h-5 w-5 text-stone-600 dark:text-stone-300" />
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="min-h-[40px] rounded-full px-3 py-2 font-chinese text-sm text-stone-600 transition-colors hover:bg-white/70 dark:text-stone-300 dark:hover:bg-white/[0.08] md:min-h-[44px]"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    title="關閉"
                                    aria-label="關閉章節查看器"
                                >
                                    <span>收起整章</span>
                                </button>
                            </div>

                            <p className="font-chinese text-xs text-stone-500 dark:text-stone-400 md:text-sm">{Object.keys(verses).length} 節經文{targetVerse ? ` · 已定位第 ${targetVerse} 節` : ''}</p>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 overflow-y-auto p-3 md:p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-stone-500 dark:text-stone-400" />
                                    <span className="ml-3 font-chinese text-sm text-stone-500 dark:text-stone-400 md:text-base">加載中...</span>
                                </div>
                            ) : (
                                <div className="mx-auto max-w-5xl space-y-1.5">
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
                                                    id={`chapter-verse-${num}`}
                                                    className={`group min-h-[48px] rounded-2xl border p-2.5 transition-colors cursor-pointer md:p-3 ${
                                                        isSelected
                                                            ? 'border-amber-500/60 bg-amber-50/80 dark:border-amber-300/50 dark:bg-amber-950/20'
                                                            : targetVerse === num
                                                                ? 'border-amber-500/40 bg-white/85 ring-1 ring-amber-500/20 dark:border-amber-300/40 dark:bg-white/[0.07]'
                                                                : 'border-stone-900/10 bg-white/55 hover:bg-white/85 dark:border-amber-200/10 dark:bg-[#211b13]/70 dark:hover:bg-white/[0.06]'
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
                                                            className="pointer-events-none mt-1 h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 md:h-4 md:w-4"
                                                            aria-label={`選擇第 ${verseNum} 節`}
                                                        />

                                                        {/* 节数标记 */}
                                                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-950 md:h-7 md:w-7 md:text-sm">
                                                            {verseNum}
                                                        </span>

                                                        {/* 经文内容 */}
                                                        <p className="flex-1 font-chinese text-base leading-7 text-stone-800 dark:text-stone-100">
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
                                                            className="flex min-h-[40px] min-w-[40px] flex-shrink-0 items-center justify-center gap-1 rounded-full border border-stone-900/10 bg-white/80 px-3 py-2 text-stone-700 shadow-sm transition-colors hover:bg-white disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.07] dark:text-stone-100 dark:hover:bg-white/[0.1] md:min-w-0"
                                                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                                            title="插入此節"
                                                            aria-label="插入此節"
                                                        >
                                                            <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                                            <span className="hidden font-chinese text-xs md:inline">插入</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* 底部操作栏 */}
                        <div className="flex min-h-[52px] items-center justify-between gap-3 border-t border-stone-900/10 bg-white/65 p-2.5 backdrop-blur-xl dark:border-amber-200/10 dark:bg-[#211b13]/70 md:p-3">
                            {/* 左侧：选择提示 */}
                            <div className="font-chinese text-xs text-stone-500 dark:text-stone-400 md:text-sm">
                                {selectedVerses.size > 0 ? `已選 ${selectedVerses.size} 節，可批量插入` : '點擊經文多選，或用右側按鈕插入單節'}
                            </div>

                            {/* 右侧：操作按钮 */}
                            <div className="flex gap-2">
                                {selectedVerses.size > 0 && (
                                    <>
                                        <button
                                            onClick={handleClearSelection}
                                            className="min-h-[40px] rounded-full border border-stone-900/10 bg-white/70 px-3 py-2 font-chinese text-xs text-stone-600 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300 md:text-sm touch-manipulation"
                                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={handleInsertSelected}
                                            disabled={isInserting}
                                            className="flex min-h-[40px] items-center gap-1 rounded-full bg-stone-950 px-3 py-2 font-chinese text-xs text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-950 md:px-4 md:text-sm touch-manipulation"
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
