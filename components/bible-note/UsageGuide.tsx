'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, FileText, Search, Download, BookOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function UsageGuide() {
    const { t } = useTranslation();
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
                title={t('note.guide.toggle')}
                aria-label={t('note.guide.toggle')}
            >
                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-bible-600 dark:text-bible-300" />
                <span className="hidden sm:inline text-sm font-chinese text-bible-700 dark:text-bible-200">
                    {t('note.guide.toggle')}
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
                                    {t('note.guide.title')}
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
                                        {t('note.guide.markdown.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.guide.markdown.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 功能 2 */}
                            <div className="flex items-start gap-3">
                                <Search className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        {t('note.guide.autocomplete.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.guide.autocomplete.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 功能 3 */}
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        {t('note.guide.view.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.guide.view.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 功能 4 */}
                            <div className="flex items-start gap-3">
                                <Download className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        {t('note.guide.export.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.guide.export.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 重要提示 */}
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 font-chinese mb-2">
                                    {t('note.guide.important.title')}
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 font-chinese space-y-1 ml-4">
                                    <li>{t('note.guide.important.point1')}</li>
                                    <li>{t('note.guide.important.point2')}</li>
                                    <li>{t('note.guide.important.point3')}</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
