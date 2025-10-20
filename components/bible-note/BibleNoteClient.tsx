'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, FileDown, Copy, ChevronDown, BookOpen, HelpCircle, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { parseVerseReferences } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import MarkdownEditor from './MarkdownEditor';
import UsageGuide from './UsageGuide';
import VerseReferenceList from './VerseReferenceList';
import ChapterViewer from './ChapterViewer';

export default function BibleNoteClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, toggleTheme } = useAppStore();
    const [content, setContent] = useState('');
    const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'references'>('edit');
    const [isExpanding, setIsExpanding] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showSideMenu, setShowSideMenu] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [chapterViewerState, setChapterViewerState] = useState<{ isOpen: boolean; book: string; chapter: number }>({
        isOpen: false,
        book: '',
        chapter: 0,
    });
    const [lastViewedBook, setLastViewedBook] = useState<string>('');
    const [lastViewedChapter, setLastViewedChapter] = useState<number>(1);

    // 从 localStorage 恢复内容
    useEffect(() => {
        const saved = localStorage.getItem('bible-note-content');
        if (saved) {
            setContent(saved);
        }
    }, []);

    // 从 localStorage 恢复上次查看的章节
    useEffect(() => {
        const saved = localStorage.getItem('bible-note-last-viewed');
        if (saved) {
            try {
                const { book, chapter } = JSON.parse(saved);
                setLastViewedBook(book);
                setLastViewedChapter(chapter);
            } catch (error) {
                console.error('Error parsing last viewed:', error);
                setLastViewedBook('GEN');
                setLastViewedChapter(1);
            }
        } else {
            // 默认为创世记1章
            setLastViewedBook('GEN');
            setLastViewedChapter(1);
        }
    }, []);

    // 保存上次查看的章节到 localStorage
    useEffect(() => {
        if (lastViewedBook && lastViewedChapter) {
            localStorage.setItem(
                'bible-note-last-viewed',
                JSON.stringify({
                    book: lastViewedBook,
                    chapter: lastViewedChapter,
                })
            );
        }
    }, [lastViewedBook, lastViewedChapter]);

    // 自动保存到 localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content) {
                localStorage.setItem('bible-note-content', content);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [content]);

    // Toast 自动消失
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // 显示 Toast 提示
    const showToast = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    // 解析经文引用（去重）
    const references = useMemo(() => {
        const allRefs = parseVerseReferences(content);

        // 去重：基于 original（如"约3:16"）
        const seen = new Set<string>();
        const uniqueRefs = allRefs.filter((ref) => {
            if (seen.has(ref.original)) {
                return false;
            }
            seen.add(ref.original);
            return true;
        });

        return uniqueRefs;
    }, [content]);

    // 导出到文件
    const handleExportToFile = useCallback(() => {
        const date = new Date().toISOString().split('T')[0];
        const filename = `圣经笔记_${date}.md`;

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    }, [content]);

    // 复制到剪贴板
    const handleCopyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(content);
            showToast('✅ 已複製到剪貼板');
            setShowExportMenu(false);
        } catch (error) {
            console.error('Failed to copy:', error);
            showToast('❌ 複製失敗，請稍後再試');
        }
    }, [content, showToast]);

    // 清空笔记
    const handleClear = useCallback(() => {
        if (confirm('確定要清空筆記嗎？此操作無法撤銷。')) {
            setContent('');
            localStorage.removeItem('bible-note-content');
        }
    }, []);

    // 展开所有经文（跳过已展开的）
    const handleExpandAll = useCallback(async () => {
        if (references.length === 0) {
            showToast('⚠️ 未檢測到經文引用');
            return;
        }

        setIsExpanding(true);

        try {
            // 检测已展开的经文（格式：> 约3:16: ...）
            // 需要检查引用后面紧跟着换行和 > 引用块
            const expandedRefs = new Set<string>();

            // 遍历所有引用，检查其后面是否紧跟着展开的内容
            references.forEach((ref) => {
                // 查找引用在内容中的位置
                const refEnd = ref.position + ref.original.length;
                // 获取引用后的内容（接下来的 200 个字符）
                const afterRef = content.slice(refEnd, refEnd + 200);

                // 检查是否紧跟着换行和 > 引用块，且包含相同的引用
                // 格式：\n> 约3:16: 经文内容
                const expandedPattern = new RegExp(`^\\s*\\n>\\s*${ref.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:：]`, 'm');

                if (expandedPattern.test(afterRef)) {
                    expandedRefs.add(ref.original.trim());
                }
            });

            // 过滤出未展开的经文
            const toExpand = references.filter((ref) => {
                return !expandedRefs.has(ref.original.trim());
            });

            if (toExpand.length === 0) {
                showToast('✅ 所有經文已展開');
                setIsExpanding(false);
                return;
            }

            // 从后往前处理，避免位置偏移
            const sortedRefs = [...toExpand].sort((a, b) => b.position - a.position);

            let newContent = content;

            for (const ref of sortedRefs) {
                // 获取经文内容
                const text = await getVerseText(ref.book, ref.chapter, ref.startVerse);

                if (text) {
                    // 在引用后插入完整经文
                    const insertion = `\n> ${ref.original}: ${text}\n`;
                    const pos = ref.position + ref.original.length;

                    newContent = newContent.slice(0, pos) + insertion + newContent.slice(pos);
                }
            }

            setContent(newContent);

            // 给用户反馈
            const skipped = references.length - toExpand.length;
            if (skipped > 0) {
                showToast(`✅ 已展開 ${toExpand.length} 節，跳過 ${skipped} 節`);
            } else {
                showToast(`✅ 已展開 ${toExpand.length} 節經文`);
            }
        } catch (error) {
            console.error('Error expanding verses:', error);
            showToast('❌ 展開失敗，請稍後再試');
        } finally {
            setIsExpanding(false);
        }
    }, [content, references, showToast]);

    // 查看整章（打开浮动面板而不是跳转）
    const handleViewChapter = useCallback((book: string, chapter: number) => {
        setChapterViewerState({ isOpen: true, book, chapter });
        setLastViewedBook(book);
        setLastViewedChapter(chapter);
    }, []);

    // 打开圣经查看器（使用上次查看的位置）
    const handleOpenBible = useCallback(() => {
        setChapterViewerState({
            isOpen: true,
            book: lastViewedBook || 'GEN',
            chapter: lastViewedChapter || 1,
        });
    }, [lastViewedBook, lastViewedChapter]);

    // 章节变化回调
    const handleChapterChange = useCallback((book: string, chapter: number) => {
        setLastViewedBook(book);
        setLastViewedChapter(chapter);
    }, []);

    // 插入经文到笔记末尾
    const handleInsertVerses = useCallback(
        (verses: Array<{ book: string; chapter: number; verse: number; text: string }>) => {
            // 格式化经文为 Markdown 引用格式
            const insertText = verses
                .map((v) => {
                    const ref = `${v.book}${v.chapter}:${v.verse}`;
                    return `\n> ${ref}: ${v.text}\n`;
                })
                .join('');

            // 插入到笔记末尾
            setContent((prevContent) => prevContent + insertText);

            showToast(`✅ 已插入 ${verses.length} 節經文`);

            // 关闭章节查看器，返回笔记
            setChapterViewerState({ isOpen: false, book: '', chapter: 0 });
        },
        [showToast]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* 共用头部 */}
            <PageHeader
                    onMenuClick={() => setShowSideMenu(true)}
                    onHelpClick={() => setShowHelp(true)}
                    showHelp={true}
                    subtitle={
                        <span className="flex items-center gap-2 text-bible-600 dark:text-bible-400">
                            筆記本
                            <span className="px-2 py-0.5 text-xs bg-gold-500 text-white rounded-full font-bold">BETA</span>
                        </span>
                    }
                    rightContent={
                        <>
                            {/* 导出按钮（下拉菜单） */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    disabled={!content}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-sm touch-manipulation min-h-[44px]"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    title="導出筆記"
                                    aria-label="導出筆記"
                                >
                                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="hidden sm:inline text-sm font-chinese">導出</span>
                                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                                </button>

                                {/* 下拉菜单 */}
                                {showExportMenu && content && (
                                    <>
                                        {/* 背景遮罩 */}
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                                        {/* 菜单内容 */}
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 py-1 z-20">
                                            <button
                                                onClick={handleCopyToClipboard}
                                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors text-left"
                                            >
                                                <Copy className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-sm font-chinese text-bible-700 dark:text-bible-300">複製到剪貼板</span>
                                            </button>
                                            <button
                                                onClick={handleExportToFile}
                                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors text-left"
                                            >
                                                <FileDown className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                                <span className="text-sm font-chinese text-bible-700 dark:text-bible-300">下載 MD 文件</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleClear}
                                disabled={!content}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-sm touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="清空筆記"
                                aria-label="清空筆記"
                            >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden sm:inline text-sm font-chinese">清空</span>
                            </button>
                        </>
                    }
                    />

            {/* 主内容区域 */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* 侧边栏菜单 */}
                <SideMenu
                    isOpen={showSideMenu}
                    onClose={() => setShowSideMenu(false)}
                    onAboutClick={() => setShowAbout(true)}
                    theme={theme}
                    onThemeChange={toggleTheme}
                />

                {/* 使用说明 - 独立一行 */}
                <div className="mb-4">
                    <UsageGuide />
                </div>

                {/* 移动端 Tab 导航 - 与主站风格一致 */}
                <div className="lg:hidden mb-4">
                    <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg border border-bible-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`flex-1 py-2.5 rounded-lg font-chinese text-sm transition-all touch-manipulation min-h-[44px] ${
                                activeTab === 'edit'
                                    ? 'bg-bible-500 text-white shadow-sm'
                                    : 'text-bible-700 dark:text-bible-300 hover:bg-bible-100 dark:hover:bg-gray-700'
                            }`}
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        >
                            編輯
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`hidden md:flex flex-1 py-2.5 rounded-lg font-chinese text-sm transition-all touch-manipulation min-h-[44px] ${
                                activeTab === 'preview'
                                    ? 'bg-bible-500 text-white shadow-sm'
                                    : 'text-bible-700 dark:text-bible-300 hover:bg-bible-100 dark:hover:bg-gray-700'
                            }`}
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        >
                            預覽
                        </button>
                        <button
                            onClick={() => setActiveTab('references')}
                            className={`flex-1 py-2.5 rounded-lg font-chinese text-sm transition-all relative touch-manipulation min-h-[44px] ${
                                activeTab === 'references'
                                    ? 'bg-bible-500 text-white shadow-sm'
                                    : 'text-bible-700 dark:text-bible-300 hover:bg-bible-100 dark:hover:bg-gray-700'
                            }`}
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        >
                            引用
                            {references.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-gold-500 dark:bg-gold-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                    {references.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* 主要内容区域 - 统一卡片样式 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 编辑器区域（桌面端：2/3 宽度） */}
                    <div className={`lg:col-span-2 ${activeTab === 'edit' || activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 overflow-hidden">
                            <MarkdownEditor
                                value={content}
                                onChange={setContent}
                                placeholder={`開始記錄你的靈修筆記...

試試輸入經文引用，如「马太福音5:1」，系統會自動顯示補全建議。`}
                                onExpandVerse={getVerseText}
                            />
                        </div>
                    </div>

                    {/* 经文引用列表（桌面端：1/3 宽度） */}
                    <div className={`lg:col-span-1 ${activeTab === 'references' ? 'block' : 'hidden lg:block'}`}>
                        <VerseReferenceList
                            references={references}
                            onViewChapter={handleViewChapter}
                            onExpandAll={handleExpandAll}
                            isExpanding={isExpanding}
                        />
                    </div>
                </div>

                {/* Toast 提示 */}
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg shadow-lg z-50 font-chinese text-sm max-w-md"
                        >
                            {toastMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 章节查看器 */}
                <ChapterViewer
                    isOpen={chapterViewerState.isOpen}
                    onClose={() => setChapterViewerState({ isOpen: false, book: '', chapter: 0 })}
                    book={chapterViewerState.book}
                    chapter={chapterViewerState.chapter}
                    onInsertVerses={handleInsertVerses}
                    onChapterChange={handleChapterChange}
                />

                {/* 浮动按钮 - 打开圣经 */}
                <button
                    onClick={handleOpenBible}
                    className="fixed bottom-20 right-6 lg:bottom-8 lg:left-8 min-h-[56px] min-w-[56px] bg-bible-500 hover:bg-bible-600 active:bg-bible-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                    title="打開聖經"
                    aria-label="打開聖經查看器"
                >
                    <BookOpen className="w-6 h-6" />
                </button>

                {/* 帮助模态框 */}
                <AnimatePresence>
                    {showHelp && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
                                onClick={() => setShowHelp(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-[60]"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">📝 聖經筆記本使用說明</h2>
                                        <button
                                            onClick={() => setShowHelp(false)}
                                            className="p-2 hover:bg-bible-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                            <X className="w-5 h-5 text-bible-600 dark:text-bible-400" />
                                        </button>
                                    </div>
                                    <UsageGuide />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
            </div>
        </div>
    );
}
