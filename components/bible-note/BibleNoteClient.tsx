'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Trash2, FileDown, Copy, ChevronDown, BookOpen, HelpCircle, X, FileText, Search } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { parseVerseReferences } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import { useTranslation } from '@/lib/i18n';
import PageHeader from '@/components/layout/PageHeader';
import MarkdownEditor from './MarkdownEditor';
import UsageGuide from './UsageGuide';
import VerseReferenceList from './VerseReferenceList';

// 动态导入非关键组件以提升性能
const SideMenu = dynamic(() => import('@/components/navigation/SideMenu'), {
    ssr: false,
});
const ChapterViewer = dynamic(() => import('./ChapterViewer'), {
    ssr: false,
});

export default function BibleNoteClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, toggleTheme, language, setLanguage } = useAppStore();
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
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);

    const { t } = useTranslation();

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

    // 自动保存到 localStorage（带保存提示）
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content) {
                localStorage.setItem('bible-note-content', content);
                setShowSaveIndicator(true);
                
                // 2秒后隐藏提示
                setTimeout(() => setShowSaveIndicator(false), 2000);
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
        const filename = `bible_note_${date}.md`;

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
            showToast(t('note.toast.copied'));
            setShowExportMenu(false);
        } catch (error) {
            console.error('Failed to copy:', error);
            showToast(t('note.toast.copyFailed'));
        }
    }, [content, showToast, t]);

    // 清空笔记
    const handleClear = useCallback(() => {
        if (confirm(t('note.confirmClear'))) {
            setContent('');
            localStorage.removeItem('bible-note-content');
        }
    }, [t]);

    // 展开所有经文（跳过已展开的）
    const handleExpandAll = useCallback(async () => {
        if (references.length === 0) {
            showToast(t('note.toast.noRefFound'));
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
                showToast(t('note.toast.allExpanded'));
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
                showToast(t('note.toast.expandedSkipped', { count: toExpand.length, skipped }));
            } else {
                showToast(t('note.toast.expanded', { count: toExpand.length }));
            }
        } catch (error) {
            console.error('Error expanding verses:', error);
            showToast(t('note.toast.expandFailed'));
        } finally {
            setIsExpanding(false);
        }
    }, [content, references, showToast, t]);

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

            showToast(t('note.toast.inserted', { count: verses.length }));

            // 关闭章节查看器，返回笔记
            setChapterViewerState({ isOpen: false, book: '', chapter: 0 });
        },
        [showToast, t]
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
                        {t('note.title')}
                        <span className="px-2 py-0.5 text-xs bg-gold-500 text-white rounded-full font-bold">{t('note.beta')}</span>
                    </span>
                }
                rightContent={
                    <>
                        {/* 自动保存提示 */}
                        {showSaveIndicator && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-chinese animate-fade-in">
                                {t('note.autoSaved')}
                            </span>
                        )}
                        
                        {/* 导出按钮（下拉菜单） */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={!content}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-sm touch-manipulation min-h-[44px]"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title={t('note.exportLabel')}
                                aria-label={t('note.exportLabel')}
                            >
                                <Download className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden sm:inline text-sm font-chinese">{t('note.export')}</span>
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
                                            <span className="text-base md:text-sm font-chinese text-bible-700 dark:text-bible-300">{t('note.copyToClipboard')}</span>
                                        </button>
                                        <button
                                            onClick={handleExportToFile}
                                            className="w-full flex items-center gap-3 px-4 py-3 md:py-2 hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors text-left min-h-[48px] md:min-h-0"
                                        >
                                            <FileDown className="w-5 h-5 md:w-4 md:h-4 text-bible-600 dark:text-bible-400" />
                                            <span className="text-base md:text-sm font-chinese text-bible-700 dark:text-bible-300">{t('note.downloadMd')}</span>
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
                            title={t('note.clearLabel')}
                            aria-label={t('note.clearLabel')}
                        >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline text-sm font-chinese">{t('note.clear')}</span>
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
                    language={language}
                    onLanguageChange={setLanguage}
                />

                {/* 使用说明 - 条件显示 */}
                {showHelp && (
                    <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-4 md:p-6 animate-fade-in">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-6 h-6 text-bible-600 dark:text-bible-400" />
                                <h2 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                    {t('note.help.title')}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title={t('common.close')}
                                aria-label={t('common.close')}
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
                                        {t('note.help.markdown.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.help.markdown.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 功能 2 */}
                            <div className="flex items-start gap-3">
                                <Search className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        {t('note.help.autocomplete.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.help.autocomplete.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 功能 3 */}
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        {t('note.help.viewRef.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.help.viewRef.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 功能 4 */}
                            <div className="flex items-start gap-3">
                                <Download className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                        {t('note.help.export.title')}
                                    </h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                        {t('note.help.export.desc')}
                                    </p>
                                </div>
                            </div>

                            {/* 重要提示 */}
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 font-chinese mb-2">
                                    {t('note.help.warning.title')}
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 font-chinese space-y-1 ml-4">
                                    <li>{t('note.help.warning.1')}</li>
                                    <li>{t('note.help.warning.2')}</li>
                                    <li>{t('note.help.warning.3')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
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
                            {t('note.tab.edit')}
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
                            {t('note.tab.preview')}
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
                            {t('note.tab.references')}
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
                                placeholder={t('note.placeholder.start')}
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
                {toastMessage && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg shadow-lg z-50 font-chinese text-sm max-w-md animate-fade-in">
                        {toastMessage}
                    </div>
                )}

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
                    title={t('note.openBible')}
                    aria-label={t('note.openBible')}
                >
                    <BookOpen className="w-6 h-6 lg:w-5 lg:h-5" />
                </button>
            </div>
        </div>
    );
}
