'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, FileDown, Copy, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { parseVerseReferences } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import AppHeader from '@/components/layout/AppHeader';
import SideMenu from '@/components/navigation/SideMenu';
import MarkdownEditor from './MarkdownEditor';
import UsageGuide from './UsageGuide';
import VerseReferenceList from './VerseReferenceList';

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

    // 从 localStorage 恢复内容
    useEffect(() => {
        const saved = localStorage.getItem('bible-note-content');
        if (saved) {
            setContent(saved);
        }
    }, []);

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

    // 查看整章
    const handleViewChapter = useCallback(
        (book: string, chapter: number) => {
            // 跳转到主站，带上 from 参数
            router.push(`/?book=${encodeURIComponent(book)}&chapter=${chapter}&from=bible-note`);
        },
        [router]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* 共用头部 */}
                <AppHeader
                    onMenuClick={() => setShowSideMenu(true)}
                    subtitle="筆記本"
                    rightButtons={
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
                            className={`flex-1 py-2.5 rounded-lg font-chinese text-sm transition-all touch-manipulation min-h-[44px] ${
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
                                placeholder="開始記錄你的靈修筆記...\n\n試試輸入經文引用，如「马太福音5:1」，系統會自動顯示補全建議。"
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
            </div>
        </div>
    );
}
