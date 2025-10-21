'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, FileText, Sun, Moon, Monitor, Check, BookOpen, HelpCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark' | 'system';
    onThemeChange: () => void;
}

interface TopVerse {
    verseId: string;
    book: string;
    chapter: number;
    verse: number;
    favorites: number;
}

export default function SideMenu({ isOpen, onClose, theme, onThemeChange }: SideMenuProps) {
    // 默认显示 Mock 数据，方便本地开发
    const [topVerses, setTopVerses] = useState<TopVerse[]>([
        { verseId: '43-3-16', book: '約翰福音', chapter: 3, verse: 16, favorites: 0 },
        { verseId: '19-23-1', book: '詩篇', chapter: 23, verse: 1, favorites: 0 },
        { verseId: '50-4-13', book: '腓立比書', chapter: 4, verse: 13, favorites: 0 },
        { verseId: '45-8-28', book: '羅馬書', chapter: 8, verse: 28, favorites: 0 },
        { verseId: '20-3-5', book: '箴言', chapter: 3, verse: 5, favorites: 0 },
    ]);

    // 获取热门经文排行榜
    useEffect(() => {
        if (isOpen) {
            fetch('/api/stats/top-verses')
                .then((res) => res.json())
                .then((data) => {
                    if (data.topVerses && data.topVerses.length > 0) {
                        setTopVerses(data.topVerses);
                    }
                })
                .catch((err) => console.error('Failed to fetch top verses:', err));
        }
    }, [isOpen]);

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

                    {/* 侧边栏 */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
                    >
                        {/* 头部 */}
                        <div className="flex items-center justify-between p-4 border-b border-bible-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese">菜單</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="关闭菜单"
                            >
                                <X className="w-5 h-5 text-bible-600 dark:text-bible-400" />
                            </button>
                        </div>

                        {/* 菜单项 */}
                        <nav className="flex-1 overflow-y-auto p-4">
                            {/* 热门经文排行榜 */}
                            <div className="mb-6 bg-gradient-to-br from-gold-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gold-200 dark:border-gold-700/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                                        <h3 className="text-sm font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                            🏆 最受歡迎的經文
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {topVerses.map((verse, index) => (
                                            <div
                                                key={verse.verseId}
                                                className="flex items-start gap-2 text-xs bg-white dark:bg-gray-900 rounded-lg p-2 border border-gold-100 dark:border-gray-700"
                                            >
                                                <span className="flex-shrink-0 w-5 h-5 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-bible-800 dark:text-bible-200 font-chinese truncate">
                                                        {verse.book} {verse.chapter}:{verse.verse}
                                                    </p>
                                                    <p className="text-gold-600 dark:text-gold-400 flex items-center gap-1">
                                                        <span>⭐</span>
                                                        <span className="font-semibold">{verse.favorites.toLocaleString()}</span>
                                                        <span className="text-bible-500 dark:text-bible-400">次收藏</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            </div>

                            <div className="space-y-4">
                                {/* 背经文 */}
                                <Link
                                    href="/"
                                    onClick={onClose}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <BookOpen className="w-5 h-5 text-bible-600 dark:text-bible-400 group-hover:text-bible-700 dark:group-hover:text-bible-300" />
                                    <span className="text-bible-800 dark:text-bible-200 font-chinese font-medium">背經文</span>
                                </Link>

                                {/* 圣经笔记本 */}
                                <Link
                                    href="/note"
                                    onClick={onClose}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <FileText className="w-5 h-5 text-bible-600 dark:text-bible-400 group-hover:text-bible-700 dark:group-hover:text-bible-300" />
                                    <span className="text-bible-800 dark:text-bible-200 font-chinese font-medium">筆記本</span>
                                </Link>

                                {/* 帮助 */}
                                <Link
                                    href="/help"
                                    onClick={onClose}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <HelpCircle className="w-5 h-5 text-bible-600 dark:text-bible-400 group-hover:text-bible-700 dark:group-hover:text-bible-300" />
                                    <span className="text-bible-800 dark:text-bible-200 font-chinese font-medium">幫助</span>
                                </Link>

                                {/* 关于 */}
                                <Link
                                    href="/about"
                                    onClick={onClose}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <Info className="w-5 h-5 text-bible-600 dark:text-bible-400 group-hover:text-bible-700 dark:group-hover:text-bible-300" />
                                    <span className="text-bible-800 dark:text-bible-200 font-chinese font-medium">關於</span>
                                </Link>

                                {/* 分隔线 */}
                                <div className="border-t border-bible-200 dark:border-gray-700" />

                                {/* 外观设置 */}
                                <div>
                                    <div className="px-4 py-2">
                                        <p className="text-sm font-semibold text-bible-700 dark:text-bible-300 font-chinese">🎨 外觀</p>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        {/* 浅色模式 */}
                                        <button
                                            onClick={theme !== 'light' ? onThemeChange : undefined}
                                            disabled={theme === 'light'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                theme === 'light'
                                                    ? 'bg-bible-100 dark:bg-gray-800 cursor-default'
                                                    : 'hover:bg-bible-50 dark:hover:bg-gray-800/50 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sun className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-bible-800 dark:text-bible-200 font-chinese text-sm">淺色</span>
                                            </div>
                                            {theme === 'light' && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                        </button>

                                        {/* 深色模式 */}
                                        <button
                                            onClick={theme !== 'dark' ? onThemeChange : undefined}
                                            disabled={theme === 'dark'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                theme === 'dark'
                                                    ? 'bg-bible-100 dark:bg-gray-800 cursor-default'
                                                    : 'hover:bg-bible-50 dark:hover:bg-gray-800/50 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Moon className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-bible-800 dark:text-bible-200 font-chinese text-sm">深色</span>
                                            </div>
                                            {theme === 'dark' && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                        </button>

                                        {/* 跟随系统 */}
                                        <button
                                            onClick={theme !== 'system' ? onThemeChange : undefined}
                                            disabled={theme === 'system'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                theme === 'system'
                                                    ? 'bg-bible-100 dark:bg-gray-800 cursor-default'
                                                    : 'hover:bg-bible-50 dark:hover:bg-gray-800/50 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Monitor className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-bible-800 dark:text-bible-200 font-chinese text-sm">自動</span>
                                            </div>
                                            {theme === 'system' && <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </nav>

                        {/* 底部信息 */}
                        <div className="p-4 border-t border-bible-200 dark:border-gray-700">
                            <p className="text-xs text-bible-500 dark:text-gray-500 font-chinese text-center">你的話語 © 2025</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
