'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, FileDown, Copy, ChevronDown, BookOpen, HelpCircle, X, FileText, Search } from 'lucide-react';
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

    // 切换圣经查看器（打开/关闭）
    const handleOpenBible = useCallback(() => {
        if (chapterViewerState.isOpen) {
            // 如果已打开，则关闭
            setChapterViewerState({ isOpen: false, book: '', chapter: 0 });
        } else {
            // 如果未打开，则打开
            setChapterViewerState({
                isOpen: true,
                book: lastViewedBook || 'GEN',
                chapter: lastViewedChapter || 1,
            });
        }
    }, [chapterViewerState.isOpen, lastViewedBook, lastViewedChapter]);

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
                                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                                    {/* 菜单内容 - 移动端底部弹出，桌面端下拉 */}
                                    <div className="fixed md:absolute bottom-0 md:bottom-auto left-0 right-0 md:right-0 md:left-auto md:mt-2 w-full md:w-48 bg-white dark:bg-gray-800 rounded-t-xl md:rounded-lg shadow-2xl border-t md:border border-bible-200 dark:border-gray-700 py-3 md:py-1 z-50">
                                        <button
                                            onClick={handleCopyToClipboard}
                                            className="w-full flex items-center gap-3 px-4 py-3 md:py-2 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors text-left min-h-[48px] md:min-h-0"
                                        >
                                            <Copy className="w-5 h-5 md:w-4 md:h-4 text-bible-600 dark:text-bible-400" />
                                            <span className="text-base md:text-sm font-chinese text-bible-700 dark:text-bible-300">複製到剪貼板</span>
                                        </button>
                                        <button
                                            onClick={handleExportToFile}
                                            className="w-full flex items-center gap-3 px-4 py-3 md:py-2 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors text-left min-h-[48px] md:min-h-0"
                                        >
                                            <FileDown className="w-5 h-5 md:w-4 md:h-4 text-bible-600 dark:text-bible-400" />
                                            <span className="text-base md:text-sm font-chinese text-bible-700 dark:text-bible-300">下載 MD 文件</span>
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

            {/* 主内容区域 - 根据 ChapterViewer 状态调整高度 */}
            <div className={`max-w-7xl mx-auto px-4 py-4 md:py-6 transition-all duration-300 ${
                chapterViewerState.isOpen 
                    ? 'h-[calc(50vh-5rem)] overflow-y-auto' 
                    : 'min-h-[calc(100vh-8rem)]'
            }`}>
                {/* 侧边栏菜单 */}
                <SideMenu
                    isOpen={showSideMenu}
                    onClose={() => setShowSideMenu(false)}
                    theme={theme}
                    onThemeChange={toggleTheme}
                />

                {/* 使用说明 - 条件显示 */}
                {showHelp && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-4 md:p-6"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-6 h-6 text-bible-600 dark:text-bible-400" />
                                <h2 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                    如何使用聖經筆記本
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="關閉"
                                aria-label="關閉使用說明"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 直接显示使用说明内容，不需要再点击 */}
                        <div className="space-y-3">
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
                                        輸入書卷名（如「马太」或「马1:2」）會自動彈出經文建議。選中後自動插入經文完整內容。支持模糊搜索，如「路1:1」會匹配「路加福音1:1」。
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
                                        右側（桌面端）或「引用」標籤（移動端）會顯示所有引用的經文完整內容。點擊「查看整章」會在底部彈出浮動窗口，可同時查看整章和編輯筆記。
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

                            {/* 重要提示 */}
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 font-chinese mb-2">
                                    ⚠️ 重要提示
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 font-chinese space-y-1 ml-4">
                                    <li>• 僅支持一篇筆記，適合作為草稿使用</li>
                                    <li>• 數據保存在瀏覽器本地，清除瀏覽器數據會丟失</li>
                                    <li>• 建議定期導出備份（複製到剪貼板或下載 MD 文件）</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 移动端 Tab 导航 - 超紧凑版 */}
                <div className="lg:hidden mb-2">
                    <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg border border-bible-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`flex-1 py-1.5 rounded-lg font-chinese text-sm transition-all touch-manipulation min-h-[40px] ${
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
                            className={`hidden md:flex flex-1 py-1.5 rounded-lg font-chinese text-sm transition-all touch-manipulation min-h-[40px] ${
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
                            className={`flex-1 py-1.5 rounded-lg font-chinese text-sm transition-all relative touch-manipulation min-h-[40px] ${
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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

                {/* 浮动按钮 - 位置根据 ChapterViewer 状态调整 */}
                <button
                    onClick={handleOpenBible}
                    className={`fixed ${
                        chapterViewerState.isOpen 
                            ? 'bottom-[52vh]' 
                            : 'bottom-20 lg:bottom-8'
                    } right-6 lg:left-8 min-h-[56px] min-w-[56px] lg:min-h-[48px] lg:min-w-[48px] bg-bible-500 hover:bg-bible-600 active:bg-bible-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center touch-manipulation`}
                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                    title="打開聖經"
                    aria-label="打開聖經查看器"
                >
                    <BookOpen className="w-6 h-6 lg:w-5 lg:h-5" />
                </button>
            </div>
        </div>
    );
}
