'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, FileText, Sun, Moon, Monitor, Check, BookOpen, HelpCircle, TrendingUp, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark' | 'system';
    onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
    onViewChapter?: (bookName: string, chapter: number) => void;
    language: 'simplified' | 'traditional';
    onLanguageChange: (lang: 'simplified' | 'traditional') => void;
}

interface TopVerse {
    verseId: string;
    book: string;
    chapter: number;
    verse: number;
    favorites: number;
    text?: string; // 经文内容
}

export default function SideMenu({ isOpen, onClose, theme, onThemeChange, onViewChapter, language, onLanguageChange }: SideMenuProps) {
    const [topVerses, setTopVerses] = useState<TopVerse[]>([]);
    const [topVersesLoading, setTopVersesLoading] = useState(true);

    // 获取热门经文排行榜（带加载状态和错误处理）
    useEffect(() => {
        if (isOpen) {
            setTopVersesLoading(true);
            const fetchTopVerses = async () => {
                try {
                    const response = await fetch('/api/stats/top-verses');
                    if (response.ok) {
                        const data = await response.json();
                        setTopVerses(data.topVerses || []);
                    } else {
                        setTopVerses([]);
                    }
                } catch (error) {
                    console.error('Failed to fetch top verses:', error);
                    setTopVerses([]);
                } finally {
                    setTopVersesLoading(false);
                }
            };
            fetchTopVerses();
        }
    }, [isOpen]);

    // 查看章节功能（通过回调函数）
    const handleViewChapter = (book: string, chapter: number) => {
        if (onViewChapter) {
            onViewChapter(book, chapter);
        }
        onClose();
    };

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
                        className="fixed inset-0 z-50 bg-stone-950/28 backdrop-blur-sm dark:bg-black/58"
                        onClick={onClose}
                    />

                    {/* 侧边栏 */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="liquid-glass fixed bottom-3 right-3 top-3 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.75rem]"
                    >
                        {/* 头部 */}
                        <div className="flex items-center justify-between border-b border-stone-900/10 p-4 dark:border-white/10">
                            <h2 className="text-lg font-semibold tracking-[0.12em] text-stone-900 dark:text-stone-100 font-chinese">菜單</h2>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-stone-500 transition-colors hover:bg-white/55 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.08] dark:hover:text-stone-50"
                                aria-label="关闭菜单"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* 菜单项 */}
                        <nav className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {/* 背经文 */}
                                <Link
                                    href="/"
                                    onClick={onClose}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/55 dark:hover:bg-white/[0.07]"
                                >
                                    <BookOpen className="h-5 w-5 text-stone-500 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-50" />
                                    <span className="font-chinese font-medium text-stone-800 dark:text-stone-200">背經文</span>
                                </Link>

                                {/* 搜索 */}
                                <Link
                                    href="/search"
                                    onClick={onClose}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/55 dark:hover:bg-white/[0.07]"
                                >
                                    <Search className="h-5 w-5 text-stone-500 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-50" />
                                    <span className="font-chinese font-medium text-stone-800 dark:text-stone-200">
                                        {language === 'traditional' ? '經文搜索' : '经文搜索'}
                                    </span>
                                </Link>

                                {/* 圣经笔记本 */}
                                <Link
                                    href="/note"
                                    onClick={onClose}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/55 dark:hover:bg-white/[0.07]"
                                >
                                    <FileText className="h-5 w-5 text-stone-500 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-50" />
                                    <span className="font-chinese font-medium text-stone-800 dark:text-stone-200">筆記本</span>
                                </Link>

                                {/* 帮助 */}
                                <Link
                                    href="/help"
                                    onClick={onClose}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/55 dark:hover:bg-white/[0.07]"
                                >
                                    <HelpCircle className="h-5 w-5 text-stone-500 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-50" />
                                    <span className="font-chinese font-medium text-stone-800 dark:text-stone-200">幫助</span>
                                </Link>

                                {/* 关于 */}
                                <Link
                                    href="/about"
                                    onClick={onClose}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/55 dark:hover:bg-white/[0.07]"
                                >
                                    <Info className="h-5 w-5 text-stone-500 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-50" />
                                    <span className="font-chinese font-medium text-stone-800 dark:text-stone-200">關於</span>
                                </Link>

                                {/* 分隔线 */}
                                <div className="border-t border-stone-900/10 dark:border-white/10" />

                                {/* 外观设置 */}
                                <div>
                                    <div className="px-4 py-2">
                                        <p className="text-[11px] font-semibold tracking-[0.22em] text-stone-500 dark:text-stone-400 font-chinese">外觀</p>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        {/* 浅色模式 */}
                                        <button
                                            onClick={theme !== 'light' ? () => onThemeChange('light') : undefined}
                                            disabled={theme === 'light'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                theme === 'light'
                                                    ? 'liquid-button cursor-default'
                                                    : 'hover:bg-white/50 dark:hover:bg-white/[0.06] cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sun className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                                                <span className="text-stone-800 dark:text-stone-200 font-chinese text-sm">淺色</span>
                                            </div>
                                            {theme === 'light' && <Check className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
                                        </button>

                                        {/* 深色模式 */}
                                        <button
                                            onClick={theme !== 'dark' ? () => onThemeChange('dark') : undefined}
                                            disabled={theme === 'dark'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                theme === 'dark'
                                                    ? 'liquid-button cursor-default'
                                                    : 'hover:bg-white/50 dark:hover:bg-white/[0.06] cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Moon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                                                <span className="text-stone-800 dark:text-stone-200 font-chinese text-sm">深色</span>
                                            </div>
                                            {theme === 'dark' && <Check className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
                                        </button>

                                        {/* 跟随系统 */}
                                        <button
                                            onClick={theme !== 'system' ? () => onThemeChange('system') : undefined}
                                            disabled={theme === 'system'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                theme === 'system'
                                                    ? 'liquid-button cursor-default'
                                                    : 'hover:bg-white/50 dark:hover:bg-white/[0.06] cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Monitor className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                                                <span className="text-stone-800 dark:text-stone-200 font-chinese text-sm">自動</span>
                                            </div>
                                            {theme === 'system' && <Check className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
                                        </button>
                                    </div>
                                </div>

                                {/* 语言设置 */}
                                <div className="mt-4">
                                    <div className="px-4 py-2">
                                        <p className="text-[11px] font-semibold tracking-[0.22em] text-stone-500 dark:text-stone-400 font-chinese">語言</p>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        {/* 简体 */}
                                        <button
                                            onClick={() => language !== 'simplified' && onLanguageChange('simplified')}
                                            disabled={language === 'simplified'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                language === 'simplified'
                                                    ? 'liquid-button cursor-default'
                                                    : 'hover:bg-white/50 dark:hover:bg-white/[0.06] cursor-pointer'
                                            }`}
                                        >
                                            <span className="text-stone-800 dark:text-stone-200 font-chinese text-sm">简体中文</span>
                                            {language === 'simplified' && <Check className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
                                        </button>

                                        {/* 繁体 */}
                                        <button
                                            onClick={() => language !== 'traditional' && onLanguageChange('traditional')}
                                            disabled={language === 'traditional'}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                                                language === 'traditional'
                                                    ? 'liquid-button cursor-default'
                                                    : 'hover:bg-white/50 dark:hover:bg-white/[0.06] cursor-pointer'
                                            }`}
                                        >
                                            <span className="text-stone-800 dark:text-stone-200 font-chinese text-sm">繁體中文</span>
                                            {language === 'traditional' && <Check className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
                                        </button>
                                    </div>
                                </div>

                                {/* 热门经文排行榜 - 移到底部 */}
                                <div className="mt-6 border-t border-stone-900/10 pt-4 dark:border-white/10">
                                    <div className="liquid-button rounded-[1.25rem] p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                                            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 font-chinese">最多收藏經文</h3>
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                                            {topVersesLoading ? (
                                                // 加载骨架屏
                                                <div className="space-y-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gold-100 dark:border-gray-700">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse-slow"></div>
                                                                <div className="flex-1 space-y-1.5">
                                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse-slow"></div>
                                                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full animate-pulse-slow"></div>
                                                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2 animate-pulse-slow"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : topVerses.length > 0 ? (
                                                topVerses.slice(0, 7).map((verse, index) => (
                                                <div
                                                    key={verse.verseId}
                                                    className="flex items-start justify-between gap-2 rounded-2xl border border-stone-900/10 bg-white/35 p-2 text-xs dark:border-white/10 dark:bg-white/[0.035]"
                                                >
                                                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-stone-900/80 text-xs font-semibold text-white dark:bg-white/80 dark:text-stone-950">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-stone-800 dark:text-stone-200 font-chinese truncate">
                                                            {verse.book} {verse.chapter}:{verse.verse}
                                                        </p>
                                                        {/* 经文内容 - 小字显示，完整内容 */}
                                                        {verse.text && (
                                                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-chinese mt-1 leading-relaxed">
                                                                {verse.text}
                                                            </p>
                                                        )}
                                                        <p className="flex items-center gap-1 mt-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400 dark:bg-stone-500" />
                                                            <span className="font-semibold text-gold-600 dark:text-gold-400">{verse.favorites.toLocaleString()}</span>
                                                            <span className="text-gray-600 dark:text-gray-400">人收藏</span>
                                                        </p>
                                                    </div>
                                                    {/* 查看章节按钮 */}
                                                    <button
                                                        onClick={() => handleViewChapter(verse.book, verse.chapter)}
                                                        className="shrink-0 p-1.5 rounded hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors"
                                                        title="查看章节"
                                                        aria-label={`查看 ${verse.book} ${verse.chapter}章`}
                                                    >
                                                        <ChevronRight className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                                                    </button>
                                                </div>
                                                ))
                                            ) : (
                                                // 空状态
                                                <div className="text-center py-4">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-chinese">暫無數據</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* 总排行榜链接 */}
                                        <Link
                                            href="/rankings"
                                            onClick={onClose}
                                            className="liquid-button mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-white/65 dark:text-stone-200 dark:hover:bg-white/[0.08] font-chinese"
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                            <span>查看總排行榜</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </nav>

                        {/* 底部信息 */}
                        <div className="border-t border-stone-900/10 p-4 dark:border-white/10">
                            <p className="text-center text-xs text-stone-500 dark:text-stone-500 font-chinese">你的話語 © 2025</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
