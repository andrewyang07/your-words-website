'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, FileText, Search, Download, BookOpen } from 'lucide-react';

export default function UsageGuide() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem('bible-note-guide-seen');
        if (!hasVisited) {
            setIsOpen(true);
            localStorage.setItem('bible-note-guide-seen', 'true');
        }
    }, []);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm touch-manipulation min-h-[44px]"
                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                title="使用說明"
                aria-label="打開使用說明"
            >
                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-bible-600 dark:text-bible-300" />
                <span className="hidden sm:inline text-sm font-chinese text-bible-700 dark:text-bible-200">
                    使用說明
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-6 mb-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-6 h-6 text-bible-600 dark:text-bible-400" />
                                <h3 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                    如何使用聖經筆記本
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        富文本編輯
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        所見即所得的編輯體驗。選中文字時會彈出格式工具欄，支持粗體、斜體、標題、引用等格式。
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Search className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        @ 搜索經文
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        輸入 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">@</code> 後跟經文名稱即可搜索。支持拼音（如 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">@yuehan</code>）、中文（如 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">@约3:16</code>）和模糊匹配。選中後自動插入經文。
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Search className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        / 斜杠命令
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        在空行開頭輸入 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">/</code> 可快速插入經文搜索、標題、引用、列表、分割線等元素。
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        查看引用的經文
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        右側（桌面端）或「引用」標籤（移動端）會顯示所有引用的經文完整內容。點擊「查看整章」會在底部彈出浮動窗口。
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Download className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        展開與導出
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        點擊「展開所有經文」可將完整經文內容插入筆記。完成後使用「導出」下載為 Markdown 文件。
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 font-chinese mb-2">
                                    重要提示
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 font-chinese space-y-1 ml-4">
                                    <li>支持多篇笔记，点击顶部「笔记」按钮管理笔记列表</li>
                                    <li>數據保存在瀏覽器本地，清除瀏覽器數據會丟失</li>
                                    <li>建議定期導出備份（複製到剪貼板或下載 MD 文件）</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
