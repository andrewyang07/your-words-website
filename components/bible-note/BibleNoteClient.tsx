'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Trash2, FileDown, Copy, ChevronDown, BookOpen, HelpCircle, X, FileText, Search, Loader2, Check, AlertCircle, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { parseVerseReferences, type VerseReference } from '@/lib/verseParser';
import { getVerseText } from '@/lib/verseLoader';
import PageHeader from '@/components/layout/PageHeader';
import NoteEditor, { type NoteEditorHandle } from './NoteEditor';
import UsageGuide from './UsageGuide';
import VerseReferenceList from './VerseReferenceList';
import OcrImporter from './OcrImporter';
import NoteList from './NoteList';
import { getAllNotes, getNote, saveNote, createNote, migrateFromLocalStorage, extractTitle, type Note } from '@/lib/noteStorage';
import { initializeSearch } from '@/lib/editorSearch';

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
    const editorRef = useRef<NoteEditorHandle | null>(null);
    const { theme, setTheme, language, setLanguage } = useAppStore();
    const [content, setContent] = useState('');
    const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
    const [currentNoteCreatedAt, setCurrentNoteCreatedAt] = useState<number>(Date.now());
    const [showNoteList, setShowNoteList] = useState(false);
    const [activeTab, setActiveTab] = useState<'edit' | 'references'>('edit');
    const [isExpanding, setIsExpanding] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showSideMenu, setShowSideMenu] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [chapterViewerState, setChapterViewerState] = useState<{ isOpen: boolean; book: string; chapter: number; verse?: number }>({
        isOpen: false,
        book: '',
        chapter: 0,
    });
    const [lastViewedBook, setLastViewedBook] = useState<string>('');
    const [lastViewedChapter, setLastViewedChapter] = useState<number>(1);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // 初始化：迁移旧数据，加载最新笔记，预加载搜索引擎
    useEffect(() => {
        const init = async () => {
            await migrateFromLocalStorage();
            const notes = await getAllNotes();
            let id: string;
            if (notes.length > 0) {
                id = notes[0].id;
            } else {
                const note = await createNote();
                id = note.id;
            }
            const note = await getNote(id);
            if (note) {
                setCurrentNoteId(note.id);
                setCurrentNoteCreatedAt(note.createdAt);
                setContent(note.content);
            }
        };
        void init();

        // Eagerly initialize search engine (non-blocking)
        void initializeSearch();
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

    // 自动保存到 IndexedDB（带保存提示）
    useEffect(() => {
        if (!currentNoteId) return;
        const timer = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                await saveNote({ id: currentNoteId, title: extractTitle(content), content, createdAt: currentNoteCreatedAt, updatedAt: Date.now() });
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Save failed:', error);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 5000);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, currentNoteId, currentNoteCreatedAt]);

    // Toast 自动消失
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    const handleSelectNote = useCallback(async (id: string) => {
        const note = await getNote(id);
        if (note) {
            setCurrentNoteId(note.id);
            setCurrentNoteCreatedAt(note.createdAt);
            setContent(note.content);
        }
    }, []);

    const handleNewNote = useCallback(async () => {
        const note = await createNote();
        setCurrentNoteId(note.id);
        setCurrentNoteCreatedAt(note.createdAt);
        setContent(note.content);
        setShowNoteList(false);
    }, []);

    // 解析经文引用（去重）
    const references = useMemo(() => {
        const allRefs = parseVerseReferences(content);
        const seen = new Set<string>();
        return allRefs.filter((ref) => {
            const key = `${ref.book}-${ref.chapter}-${ref.startVerse}-${ref.endVerse ?? ref.startVerse}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [content]);

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

    const handleCopyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(content);
            showToast('已複製到剪貼板');
            setShowExportMenu(false);
        } catch (error) {
            console.error('Failed to copy:', error);
            showToast('複製失敗，請稍後再試');
        }
    }, [content, showToast]);

    const handleClear = useCallback(() => {
        if (confirm('確定要清空筆記嗎？此操作無法撤銷。')) {
            setContent('');
        }
    }, []);

    // 展开所有经文（跳过已展开的）
    const handleExpandAll = useCallback(async () => {
        if (references.length === 0) {
            showToast('未檢測到經文引用');
            return;
        }

        setIsExpanding(true);

        try {
            const expandedRefs = new Set<string>();

            references.forEach((ref) => {
                const refEnd = ref.position + ref.original.length;
                const afterRef = content.slice(refEnd, refEnd + 200);
                const expandedPattern = new RegExp(`^\\s*\\n>\\s*${ref.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:：]`, 'm');
                if (expandedPattern.test(afterRef)) {
                    expandedRefs.add(ref.original.trim());
                }
            });

            const toExpand = references.filter((ref) => !expandedRefs.has(ref.original.trim()));

            if (toExpand.length === 0) {
                showToast('所有經文已展開');
                setIsExpanding(false);
                return;
            }

            const sortedRefs = [...toExpand].sort((a, b) => b.position - a.position);
            let newContent = content;

            for (const ref of sortedRefs) {
                const text = await getVerseText(ref.book, ref.chapter, ref.startVerse);
                if (text) {
                    const insertion = `\n> ${ref.original}: ${text}\n`;
                    const pos = ref.position + ref.original.length;
                    newContent = newContent.slice(0, pos) + insertion + newContent.slice(pos);
                }
            }

            setContent(newContent);

            const skipped = references.length - toExpand.length;
            if (skipped > 0) {
                showToast(`已展開 ${toExpand.length} 節，跳過 ${skipped} 節`);
            } else {
                showToast(`已展開 ${toExpand.length} 節經文`);
            }
        } catch (error) {
            console.error('Error expanding verses:', error);
            showToast('展開失敗，請稍後再試');
        } finally {
            setIsExpanding(false);
        }
    }, [content, references, showToast]);

    const handleViewChapter = useCallback((book: string, chapter: number, verse?: number) => {
        setChapterViewerState({ isOpen: true, book, chapter, verse });
        setLastViewedBook(book);
        setLastViewedChapter(chapter);
    }, []);

    // ⌘N / Ctrl+N shortcut for new note
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                void handleNewNote();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNewNote]);

    const handleOpenBible = useCallback(() => {
        if (chapterViewerState.isOpen) {
            setChapterViewerState({ isOpen: false, book: '', chapter: 0 });
        } else {
            setChapterViewerState({
                isOpen: true,
                book: lastViewedBook || 'GEN',
                chapter: lastViewedChapter || 1,
            });
        }
    }, [chapterViewerState.isOpen, lastViewedBook, lastViewedChapter]);

    const handleChapterChange = useCallback((book: string, chapter: number) => {
        setLastViewedBook(book);
        setLastViewedChapter(chapter);
    }, []);

    const handleInsertVerses = useCallback(
        (verses: Array<{ book: string; chapter: number; verse: number; text: string }>) => {
            const insertText = verses
                .map((v) => {
                    const ref = `${v.book}${v.chapter}:${v.verse}`;
                    return `\n> ${ref}: ${v.text}\n`;
                })
                .join('');

            const insertedAtCursor = editorRef.current?.insertMarkdownAtCursor(insertText) ?? false;
            if (!insertedAtCursor) {
                setContent((prevContent) => prevContent + insertText);
            }
            showToast(insertedAtCursor ? `已插入 ${verses.length} 節到光標位置` : `已添加 ${verses.length} 節到筆記末尾`);
            setChapterViewerState({ isOpen: false, book: '', chapter: 0 });
        },
        [showToast]
    );

    const handleInsertFromOcr = useCallback(
        async (ocrRefs: VerseReference[], expand: boolean) => {
            if (ocrRefs.length === 0) return;

            let insertText = '';
            for (const ref of ocrRefs) {
                if (expand) {
                    const verseText = await getVerseText(ref.book, ref.chapter, ref.startVerse);
                    if (verseText) {
                        insertText += `\n${ref.original}\n> ${ref.original}: ${verseText}\n`;
                    } else {
                        insertText += `\n${ref.original}\n`;
                    }
                } else {
                    insertText += `\n${ref.original}\n`;
                }
            }

            const insertedAtCursor = editorRef.current?.insertMarkdownAtCursor(insertText) ?? false;
            if (!insertedAtCursor) {
                setContent((prev) => prev + insertText);
            }
            showToast(insertedAtCursor ? `已插入 ${ocrRefs.length} 条 OCR 引用到光标位置` : `已添加 ${ocrRefs.length} 条 OCR 引用到笔记末尾`);
        },
        [showToast]
    );

    return (
        <div className="yw-page">
            {/* Header */}
            <PageHeader
                onMenuClick={() => setShowSideMenu(true)}
                showHelp={false}
                subtitle={
                    <span className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                        筆記本
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.16em] text-amber-700 dark:text-amber-300">BETA</span>
                    </span>
                }
                rightContent={
                    <>
                        {saveStatus === 'saving' && (
                            <span className="hidden items-center gap-1 rounded-full px-2 py-1 text-xs text-stone-500 dark:text-stone-400 sm:flex">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                保存中
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="hidden items-center gap-1 rounded-full px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 sm:flex">
                                <Check className="h-3 w-3" />
                                已保存
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="hidden items-center gap-1 rounded-full px-2 py-1 text-xs text-red-600 dark:text-red-300 sm:flex">
                                <AlertCircle className="h-3 w-3" />
                                保存失敗
                            </span>
                        )}

                        <button
                            onClick={() => setShowNoteList(true)}
                            className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-700 transition-colors hover:bg-white/65 dark:text-stone-200 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                            title="笔记列表"
                            aria-label="打开笔记列表"
                        >
                            <FileText className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="hidden text-sm font-chinese sm:inline">笔记</span>
                        </button>

                        <div className="relative z-[220] overflow-visible">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={!content}
                                className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-700 transition-colors hover:bg-white/65 disabled:cursor-not-allowed disabled:opacity-45 dark:text-stone-200 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                title="導出筆記"
                                aria-label="導出筆記"
                            >
                                <Download className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden text-sm font-chinese sm:inline">導出</span>
                                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                            </button>

                            {showExportMenu && content && (
                                <>
                                    <div className="fixed inset-0 z-[9998]" onClick={() => setShowExportMenu(false)} />
                                    <div className="fixed bottom-0 left-0 right-0 z-[9999] w-full rounded-t-2xl border-t border-stone-900/10 bg-white py-3 shadow-[0_24px_70px_rgba(68,64,60,0.24)] md:absolute md:bottom-auto md:left-auto md:right-0 md:mt-2 md:w-52 md:rounded-2xl md:border dark:border-white/10 dark:bg-gray-950 md:py-1">
                                        <button
                                            onClick={handleCopyToClipboard}
                                            className="flex min-h-[48px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-100 dark:hover:bg-white/[0.08] md:min-h-0 md:py-2"
                                        >
                                            <Copy className="h-5 w-5 text-stone-600 dark:text-stone-300 md:h-4 md:w-4" />
                                            <span className="font-chinese text-base text-stone-700 dark:text-stone-200 md:text-sm">複製到剪貼板</span>
                                        </button>
                                        <button
                                            onClick={handleExportToFile}
                                            className="flex min-h-[48px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-100 dark:hover:bg-white/[0.08] md:min-h-0 md:py-2"
                                        >
                                            <FileDown className="h-5 w-5 text-stone-600 dark:text-stone-300 md:h-4 md:w-4" />
                                            <span className="font-chinese text-base text-stone-700 dark:text-stone-200 md:text-sm">下載 MD 文件</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative z-[220] overflow-visible">
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-700 transition-colors hover:bg-white/65 dark:text-stone-200 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                                title="更多笔记工具"
                                aria-label="更多笔记工具"
                            >
                                <MoreHorizontal className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden text-sm font-chinese sm:inline">更多</span>
                            </button>

                            {showMoreMenu && (
                                <>
                                    <div className="fixed inset-0 z-[9998]" onClick={() => setShowMoreMenu(false)} />
                                    <div className="fixed bottom-0 left-0 right-0 z-[9999] space-y-1 rounded-t-2xl border-t border-stone-900/10 bg-white p-3 shadow-[0_24px_70px_rgba(68,64,60,0.24)] md:absolute md:bottom-auto md:left-auto md:right-0 md:mt-2 md:w-56 md:rounded-2xl md:border dark:border-white/10 dark:bg-gray-950">
                                        <OcrImporter onInsertReferences={handleInsertFromOcr} />
                                        <button
                                            onClick={() => { setShowHelp(true); setShowMoreMenu(false); }}
                                            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/[0.08]"
                                        >
                                            <HelpCircle className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                                            <span className="font-chinese">使用说明</span>
                                        </button>
                                        <button
                                            onClick={() => { handleClear(); setShowMoreMenu(false); }}
                                            disabled={!content}
                                            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="font-chinese">清空当前笔记</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                }
            />

            {/* Main content */}
            <div className={`max-w-7xl mx-auto px-4 py-4 md:py-6 transition-all duration-300 ${
                chapterViewerState.isOpen
                    ? 'h-[calc(50vh-5rem)] overflow-y-auto'
                    : 'min-h-[calc(100vh-8rem)]'
            }`}>
                <SideMenu
                    isOpen={showSideMenu}
                    onClose={() => setShowSideMenu(false)}
                    theme={theme}
                    onThemeChange={setTheme}
                    language={language}
                    onLanguageChange={setLanguage}
                />

                <NoteList
                    isOpen={showNoteList}
                    onClose={() => setShowNoteList(false)}
                    currentNoteId={currentNoteId}
                    onSelectNote={handleSelectNote}
                    onNewNote={handleNewNote}
                />

                {/* Help modal */}
                {showHelp && (
                    <div className="fixed inset-0 z-[9998] flex justify-center items-start bg-black/50 animate-fade-in" onClick={() => setShowHelp(false)}>
                        <div className="z-[9999] mx-4 mt-20 w-full max-w-lg rounded-2xl border border-stone-900/10 bg-white p-4 shadow-[0_24px_70px_rgba(68,64,60,0.24)] md:p-6 dark:border-white/10 dark:bg-gray-950" onClick={(e) => e.stopPropagation()}>
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

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-bible-600 dark:text-bible-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-bible-800 dark:text-bible-200 mb-1 font-chinese">
                                            富文本編輯
                                        </h4>
                                        <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">
                                            所見即所得的編輯體驗，選中文字時會彈出格式工具欄。支持粗體、斜體、標題、列表、引用等格式。
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
                                            輸入 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">@</code> 後跟經文名稱（如 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">@约3:16</code>）即可搜索並插入經文。支持拼音搜索（如 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">@yuehan</code> 找到約翰福音）和模糊匹配。
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
                                            在空行開頭輸入 <code className="px-1 py-0.5 bg-bible-100 dark:bg-gray-700 rounded text-xs">/</code> 可以快速插入經文、標題、引用、列表等塊級元素。
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
                        </div>
                    </div>
                )}

                {/* Mobile tab navigation */}
                <div className="lg:hidden mb-3">
                    <div className="flex gap-1 rounded-full border border-stone-900/10 bg-white/60 p-1 shadow-[0_14px_40px_rgba(68,64,60,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`flex-1 py-1.5 rounded-lg font-chinese text-sm transition-all touch-manipulation min-h-[40px] ${
                                activeTab === 'edit'
                                    ? 'bg-stone-950 text-white shadow-sm dark:bg-stone-100 dark:text-stone-950'
                                    : 'text-stone-600 dark:text-stone-300 hover:bg-white/70 dark:hover:bg-white/[0.08]'
                            }`}
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        >
                            編輯
                        </button>
                        <button
                            onClick={() => setActiveTab('references')}
                            className={`flex-1 py-1.5 rounded-lg font-chinese text-sm transition-all relative touch-manipulation min-h-[40px] ${
                                activeTab === 'references'
                                    ? 'bg-stone-950 text-white shadow-sm dark:bg-stone-100 dark:text-stone-950'
                                    : 'text-stone-600 dark:text-stone-300 hover:bg-white/70 dark:hover:bg-white/[0.08]'
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

                {/* Main content area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Editor (desktop: 2/3 width) */}
                    <div className={`lg:col-span-2 ${activeTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
                        <div className="min-h-[520px] overflow-hidden rounded-[1.75rem] border border-stone-900/10 bg-white/78 shadow-[0_28px_80px_rgba(68,64,60,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
                            <NoteEditor
                                ref={editorRef}
                                content={content}
                                onChange={setContent}
                                onExpandVerse={getVerseText}
                            />
                        </div>
                    </div>

                    {/* Verse reference list (desktop: 1/3 width) */}
                    <div className={`lg:col-span-1 ${activeTab === 'references' ? 'block' : 'hidden lg:block'}`}>
                        <VerseReferenceList
                            references={references}
                            onViewChapter={handleViewChapter}
                            onExpandAll={handleExpandAll}
                            isExpanding={isExpanding}
                        />
                    </div>
                </div>

                {/* Toast */}
                {toastMessage && (
                    <div role="status" aria-live="polite" className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg shadow-lg z-50 font-chinese text-sm max-w-md animate-fade-in">
                        {toastMessage}
                    </div>
                )}

                {/* Chapter viewer */}
                <ChapterViewer
                    isOpen={chapterViewerState.isOpen}
                    onClose={() => setChapterViewerState({ isOpen: false, book: '', chapter: 0 })}
                    book={chapterViewerState.book}
                    chapter={chapterViewerState.chapter}
                    targetVerse={chapterViewerState.verse}
                    onInsertVerses={handleInsertVerses}
                    onChapterChange={handleChapterChange}
                />

                {/* Floating Bible button */}
                <button
                    onClick={handleOpenBible}
                    className={`fixed ${
                        chapterViewerState.isOpen
                            ? 'bottom-[45vh]'
                            : 'bottom-6 lg:bottom-8'
                    } right-4 lg:right-8 min-h-[48px] rounded-full border border-stone-900/10 bg-white/78 px-4 text-stone-800 shadow-[0_14px_40px_rgba(68,64,60,0.12)] backdrop-blur-2xl transition-all duration-300 hover:bg-white dark:border-white/10 dark:bg-gray-950/78 dark:text-stone-100 z-40 flex items-center justify-center gap-2 touch-manipulation`}
                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                    title="打開聖經"
                    aria-label="打開聖經查看器"
                >
                    <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                    <span className="hidden font-chinese text-sm sm:inline">打開聖經</span>
                </button>
            </div>
        </div>
    );
}
