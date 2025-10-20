'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Download, Trash2, FileDown } from 'lucide-react';
import { parseVerseReferences } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import UsageGuide from './UsageGuide';
import VerseReferenceList from './VerseReferenceList';

// 动态导入编辑器（仅客户端，减少初始包大小）
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
    ssr: false,
    loading: () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="h-96 flex items-center justify-center">
                <p className="text-bible-600 dark:text-bible-400 font-chinese">加載編輯器中...</p>
            </div>
        </div>
    ),
});

// 导入 SimpleMDE 样式
import 'easymde/dist/easymde.min.css';

export default function BibleNoteClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [content, setContent] = useState('');
    const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'references'>('edit');
    const [isExpanding, setIsExpanding] = useState(false);

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

    // 解析经文引用
    const references = useMemo(() => {
        return parseVerseReferences(content);
    }, [content]);

    // SimpleMDE 配置
    const editorOptions = useMemo(
        () => ({
            spellChecker: false,
            placeholder: '開始記錄你的靈修筆記...\n\n試試輸入經文引用，如「约3:16」或「马太福音5:3」，系統會自動識別並顯示完整經文。',
            status: false,
            toolbar: [
                'bold',
                'italic',
                'heading',
                '|',
                'quote',
                'unordered-list',
                'ordered-list',
                '|',
                'link',
                '|',
                'preview',
                'side-by-side',
                'fullscreen',
            ] as const,
            minHeight: '400px',
        } as any), // 使用 any 避免 SimpleMDE 类型定义问题
        []
    );

    // 导出 Markdown
    const handleExport = useCallback(() => {
        const date = new Date().toISOString().split('T')[0];
        const filename = `圣经笔记_${date}.md`;

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }, [content]);

    // 清空笔记
    const handleClear = useCallback(() => {
        if (confirm('確定要清空筆記嗎？此操作無法撤銷。')) {
            setContent('');
            localStorage.removeItem('bible-note-content');
        }
    }, []);

    // 展开所有经文
    const handleExpandAll = useCallback(async () => {
        if (references.length === 0) {
            alert('未檢測到經文引用');
            return;
        }

        setIsExpanding(true);

        try {
            // 从后往前处理，避免位置偏移
            const sortedRefs = [...references].sort((a, b) => b.position - a.position);

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
        } catch (error) {
            console.error('Error expanding verses:', error);
            alert('展開經文時發生錯誤，請稍後再試');
        } finally {
            setIsExpanding(false);
        }
    }, [content, references]);

    // 查看整章
    const handleViewChapter = useCallback(
        (book: string, chapter: number) => {
            // 跳转到主站，带上 from 参数
            router.push(`/?book=${encodeURIComponent(book)}&chapter=${chapter}&from=bible-note`);
        },
        [router]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* 头部 */}
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-bible-800 dark:text-bible-200 font-chinese">
                            📝 聖經筆記本
                        </h1>

                        <div className="flex items-center gap-2">
                            <UsageGuide />

                            <button
                                onClick={handleExport}
                                disabled={!content}
                                className="flex items-center gap-2 px-4 py-2 bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                title="導出為 Markdown 文件"
                            >
                                <Download className="w-5 h-5" />
                                <span className="hidden sm:inline text-sm font-chinese">導出</span>
                            </button>

                            <button
                                onClick={handleClear}
                                disabled={!content}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors touch-manipulation min-h-[44px]"
                                title="清空筆記"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="hidden sm:inline text-sm font-chinese">清空</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* 移动端 Tab 导航 */}
                <div className="lg:hidden mb-4">
                    <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`flex-1 py-2 rounded-lg font-chinese text-sm transition-colors ${
                                activeTab === 'edit'
                                    ? 'bg-bible-500 text-white'
                                    : 'text-bible-700 dark:text-bible-300 hover:bg-bible-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            編輯
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex-1 py-2 rounded-lg font-chinese text-sm transition-colors ${
                                activeTab === 'preview'
                                    ? 'bg-bible-500 text-white'
                                    : 'text-bible-700 dark:text-bible-300 hover:bg-bible-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            預覽
                        </button>
                        <button
                            onClick={() => setActiveTab('references')}
                            className={`flex-1 py-2 rounded-lg font-chinese text-sm transition-colors relative ${
                                activeTab === 'references'
                                    ? 'bg-bible-500 text-white'
                                    : 'text-bible-700 dark:text-bible-300 hover:bg-bible-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            引用
                            {references.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {references.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* 主要内容区域 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 编辑器区域（桌面端：2/3 宽度） */}
                    <div
                        className={`lg:col-span-2 ${activeTab === 'edit' || activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <SimpleMDE value={content} onChange={setContent} options={editorOptions} />
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
            </div>
        </div>
    );
}

