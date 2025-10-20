'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, FileText, Search, Download, BookOpen } from 'lucide-react';

export default function UsageGuide() {
    const [isOpen, setIsOpen] = useState(false);

    // 首次访问时自动展开
    useEffect(() => {
        const hasVisited = localStorage.getItem('bible-note-guide-seen');
        if (!hasVisited) {
            setIsOpen(true);
            localStorage.setItem('bible-note-guide-seen', 'true');
        }
    }, []);

    return (
        <>
            {/* 触发按钮 - 与主站风格一致 */}
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

            {/* 说明卡片 - 与主站风格一致 */}
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
                            {/* 功能 1 */}
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        Markdown 編輯
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        支持基礎 Markdown 語法，使用工具欄快速插入格式。移動端可切換「编辑」和「预览」標籤查看效果。
                                    </p>
                                </div>
                            </div>

                            {/* 功能 2 */}
                            <div className="flex items-start gap-3">
                                <Search className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        自動補全經文引用
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        輸入書卷名（如「马太」）會自動彈出章節建議。選擇後繼續輸入即可完成引用，如「马太福音3:16」。
                                    </p>
                                </div>
                            </div>

                            {/* 功能 3 */}
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        查看引用的經文
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        右側（桌面端）或「引用」標籤（移動端）會顯示所有引用的經文完整內容。點擊「查看整章」可跳轉查看完整章節。
                                    </p>
                                </div>
                            </div>

                            {/* 功能 4 */}
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

                            {/* 提示 */}
                            <div className="mt-4 p-3 bg-bible-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-bible-600 dark:text-bible-400 font-chinese">
                                    💡 <span className="font-semibold">提示：</span>
                                    笔记内容会自动保存到浏览器，刷新页面不会丢失。如需永久保存，请及时导出备份。
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

