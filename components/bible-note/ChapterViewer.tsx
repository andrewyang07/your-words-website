'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { getChapter } from '@/lib/verseLoader';

interface ChapterViewerProps {
    isOpen: boolean;
    onClose: () => void;
    book: string;
    chapter: number;
}

export default function ChapterViewer({ isOpen, onClose, book, chapter }: ChapterViewerProps) {
    const [verses, setVerses] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [bookDisplayName, setBookDisplayName] = useState('');

    // 加载章节内容
    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        
        // 加载书卷名称
        fetch('/data/books.json')
            .then((res) => res.json())
            .then((data) => {
                const bookData = data.books?.find((b: any) => b.key === book);
                if (bookData) {
                    setBookDisplayName(bookData.nameTraditional || book);
                }
            });

        // 加载章节经文
        getChapter(book, chapter)
            .then((data) => {
                setVerses(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error loading chapter:', error);
                setLoading(false);
            });
    }, [isOpen, book, chapter]);

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
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col"
                    >
                        {/* 头部 */}
                        <div className="flex items-center justify-between p-4 border-b border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-900">
                            <div>
                                <h3 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                    {bookDisplayName || book} 第 {chapter} 章
                                </h3>
                                <p className="text-xs text-bible-600 dark:text-bible-400 font-chinese">
                                    {Object.keys(verses).length} 節經文
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-bible-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="關閉"
                                aria-label="關閉章節查看器"
                            >
                                <X className="w-6 h-6 text-bible-600 dark:text-bible-400" />
                            </button>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-bible-600 dark:text-bible-400" />
                                    <span className="ml-3 text-bible-600 dark:text-bible-400 font-chinese">
                                        加載中...
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(verses)
                                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                        .map(([verseNum, verseText]) => (
                                            <motion.div
                                                key={verseNum}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: parseInt(verseNum) * 0.02 }}
                                                className="p-3 bg-bible-50 dark:bg-gray-700 rounded-lg border border-bible-200 dark:border-gray-600"
                                            >
                                                <div className="flex gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-bible-500 text-white rounded-full text-sm font-semibold">
                                                        {verseNum}
                                                    </span>
                                                    <p className="flex-1 text-bible-800 dark:text-bible-100 font-chinese text-base leading-relaxed">
                                                        {verseText}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* 底部提示 */}
                        <div className="p-3 border-t border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-900">
                            <p className="text-xs text-center text-bible-500 dark:text-bible-400 font-chinese">
                                點擊背景或按 ESC 鍵關閉
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

