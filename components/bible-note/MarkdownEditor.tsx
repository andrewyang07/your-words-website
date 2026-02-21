'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Heading, Quote, List, ListOrdered, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VerseAutocomplete from './VerseAutocomplete';
import { getChapterVerseCount } from '@/lib/verseLoader';

interface VerseSuggestion {
    display: string;
    insert: string;
    book: string;
    chapter: number;
    verse: number;
}

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onExpandVerse?: (book: string, chapter: number, verse: number) => Promise<string | null>;
}

export default function MarkdownEditor({ value, onChange, placeholder, onExpandVerse }: MarkdownEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [suggestions, setSuggestions] = useState<VerseSuggestion[]>([]);
    const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [bibleBooks, setBibleBooks] = useState<any>(null);

    // 加载书卷数据（用于自动补全）
    useEffect(() => {
        fetch('/data/books.json')
            .then((res) => res.json())
            .then((data) => {
                const booksList = data.books || data; // 兼容两种格式
                setBibleBooks(booksList);
            })
            .catch((error) => {
                console.error('Error loading books:', error);
            });
    }, []);

    // 经文节数缓存：bookKey-chapter → verseCount
    const verseCountCache = useRef<Map<string, number>>(new Map());

    // 检测经文引用模式并生成建议
    const updateSuggestions = useCallback(async () => {
        const textarea = textareaRef.current;
        if (!textarea || !bibleBooks) {
            return;
        }

        const selectionStart = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, selectionStart);

        const match = textBeforeCursor.match(/([\u4e00-\u9fa5]+)(\d+)?:?(\d+)?$/);

        if (!match) {
            setSuggestions([]);
            return;
        }

        const [, bookName, chapterNum, verseNum] = match;

        // 查找匹配的书卷 (支持模糊搜索)
        const matchedBooks = bibleBooks.filter((book: any) => {
            const traditional = book.nameTraditional || '';
            const simplified = book.nameSimplified || '';
            const key = book.key || '';

            if (traditional.includes(bookName) || simplified.includes(bookName) || key.includes(bookName)) {
                return true;
            }

            if (bookName.length === 1) {
                return traditional.startsWith(bookName) || simplified.startsWith(bookName) || key.startsWith(bookName);
            }

            if (bookName.length >= 2) {
                return traditional.includes(bookName) || simplified.includes(bookName) || key.includes(bookName);
            }

            return false;
        });

        if (matchedBooks.length === 0) {
            setSuggestions([]);
            return;
        }

        const newSuggestions: VerseSuggestion[] = [];

        // 辅助函数：获取某章的真实节数（带缓存）
        const getRealVerseCount = async (bookKey: string, chapter: number): Promise<number> => {
            const cacheKey = `${bookKey}-${chapter}`;
            const cached = verseCountCache.current.get(cacheKey);
            if (cached !== undefined) return cached;
            const count = await getChapterVerseCount(bookKey, chapter);
            verseCountCache.current.set(cacheKey, count);
            return count;
        };

        for (const book of matchedBooks) {
            const bookDisplayName = book.nameTraditional || book.key;
            const bookKey = book.key;

            if (chapterNum) {
                const chapter = parseInt(chapterNum, 10);
                if (chapter >= 1 && chapter <= book.chapters) {
                    const totalVerses = await getRealVerseCount(bookKey, chapter);
                    const maxVerse = totalVerses || 20; // fallback

                    if (verseNum) {
                        const startVerse = parseInt(verseNum, 10);
                        for (let v = startVerse; v <= Math.min(startVerse + 19, maxVerse); v++) {
                            newSuggestions.push({
                                display: `${bookDisplayName} ${chapter}:${v}`,
                                insert: `${bookKey}${chapter}:${v}`,
                                book: bookKey,
                                chapter,
                                verse: v,
                            });
                        }
                    } else {
                        for (let v = 1; v <= Math.min(20, maxVerse); v++) {
                            newSuggestions.push({
                                display: `${bookDisplayName} ${chapter}:${v}`,
                                insert: `${bookKey}${chapter}:${v}`,
                                book: bookKey,
                                chapter,
                                verse: v,
                            });
                        }
                    }
                }
            } else {
                const chapter = 1;
                const totalVerses = await getRealVerseCount(bookKey, chapter);
                const maxVerse = totalVerses || 20;
                for (let v = 1; v <= Math.min(20, maxVerse); v++) {
                    newSuggestions.push({
                        display: `${bookDisplayName} ${chapter}:${v}`,
                        insert: `${bookKey}${chapter}:${v}`,
                        book: bookKey,
                        chapter,
                        verse: v,
                    });
                }
            }
        }

        const finalSuggestions = newSuggestions.slice(0, 20);

        setSuggestions(finalSuggestions);
        setSelectedSuggestionIndex(0);

        // 计算 autocomplete 位置（考虑 textarea 滚动偏移）
        if (finalSuggestions.length > 0) {
            const textareaRect = textarea.getBoundingClientRect();
            const textareaStyle = window.getComputedStyle(textarea);

            const fontSize = parseInt(textareaStyle.fontSize, 10);
            const lineHeight = fontSize * 1.2;
            const charWidth = fontSize * 0.6;

            const cursorPos = textarea.selectionStart;
            const cursorText = value.substring(0, cursorPos);

            const lines = cursorText.split('\n');
            const currentLineIndex = lines.length - 1;
            const currentLineText = lines[currentLineIndex];

            const paddingTop = parseInt(textareaStyle.paddingTop, 10) || 0;
            const paddingLeft = parseInt(textareaStyle.paddingLeft, 10) || 0;

            const cursorX = paddingLeft + currentLineText.length * charWidth;
            const cursorY = paddingTop + (currentLineIndex + 1) * lineHeight;

            // 减去 textarea 的滚动偏移量
            const top = textareaRect.top + cursorY - textarea.scrollTop + window.scrollY + 2;
            const left = textareaRect.left + cursorX - textarea.scrollLeft + window.scrollX;

            setAutocompletePosition({ top, left });
        }
    }, [bibleBooks, value]);

    // 监听输入变化
    useEffect(() => {
        updateSuggestions();
    }, [value, updateSuggestions]);

    // 处理键盘导航
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (suggestions.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' && suggestions.length > 0) {
                e.preventDefault();
                handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
            } else if (e.key === 'Escape') {
                setSuggestions([]);
            }
        },
        [suggestions, selectedSuggestionIndex]
    );

    // 选择建议
    const handleSelectSuggestion = useCallback(
        async (suggestion: VerseSuggestion) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            const selectionStart = textarea.selectionStart;
            const textBeforeCursor = value.substring(0, selectionStart);

            // 找到要替换的文本起始位置
            const match = textBeforeCursor.match(/([\u4e00-\u9fa5]+)(\d+)?:?(\d+)?$/);
            if (!match) return;

            const matchStart = selectionStart - match[0].length;
            const textAfterCursor = value.substring(selectionStart);

            // 插入建议
            let newValue = value.substring(0, matchStart) + suggestion.insert + textAfterCursor;

            // 如果提供了展开功能，自动展开经文
            if (onExpandVerse) {
                try {
                    const verseText = await onExpandVerse(suggestion.book, suggestion.chapter, suggestion.verse);
                    if (verseText) {
                        // 在引用后插入完整经文
                        const expandedText = `\n> ${suggestion.insert}: ${verseText}\n`;
                        newValue = value.substring(0, matchStart) + suggestion.insert + expandedText + textAfterCursor;
                    }
                } catch (error) {
                    console.error('Error expanding verse:', error);
                }
            }

            onChange(newValue);

            // 设置光标位置
            setTimeout(() => {
                const newCursorPos = matchStart + suggestion.insert.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
            }, 0);

            setSuggestions([]);
        },
        [value, onChange, onExpandVerse]
    );

    // Markdown 工具栏按钮
    const insertMarkdown = useCallback(
        (before: string, after: string = '') => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = value.substring(start, end);
            const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);

            onChange(newValue);

            setTimeout(() => {
                textarea.focus();
                const newCursorPos = start + before.length + selectedText.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        },
        [value, onChange]
    );

    return (
        <div className="flex flex-col h-full">
            {/* 工具栏 */}
            <div className="flex items-center justify-between gap-2 p-2 border-b border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-900">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="粗体"
                    >
                        <Bold className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="斜体"
                    >
                        <Italic className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('### ')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="标题"
                    >
                        <Heading className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('> ')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="引用"
                    >
                        <Quote className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('- ')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="无序列表"
                    >
                        <List className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('1. ')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="有序列表"
                    >
                        <ListOrdered className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('[', '](url)')}
                        className="p-2 hover:bg-bible-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="链接"
                    >
                        <LinkIcon className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                    </button>
                </div>

                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-bible-100 dark:bg-gray-800 hover:bg-bible-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title={showPreview ? '编辑' : '预览'}
                >
                    {showPreview ? (
                        <>
                            <EyeOff className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                            <span className="text-xs font-chinese text-bible-700 dark:text-bible-300">編輯</span>
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                            <span className="text-xs font-chinese text-bible-700 dark:text-bible-300">預覽</span>
                        </>
                    )}
                </button>
            </div>

            {/* 编辑器/预览区域 */}
            <div className="flex-1 overflow-hidden">
                {showPreview ? (
                    <div className="h-full overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // 经文引用块 - 特殊样式
                                blockquote: ({ node, ...props }) => (
                                    <blockquote 
                                        className="border-l-4 border-bible-500 dark:border-bible-400 pl-4 py-2 my-3 italic text-bible-700 dark:text-bible-300 bg-bible-50 dark:bg-gray-700/50 rounded-r" 
                                        {...props} 
                                    />
                                ),
                                // 标题 (h1-h6)
                                h1: ({ node, ...props }) => (
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-5 mb-2" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2" {...props} />
                                ),
                                h4: ({ node, ...props }) => (
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1" {...props} />
                                ),
                                h5: ({ node, ...props }) => (
                                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1" {...props} />
                                ),
                                h6: ({ node, ...props }) => (
                                    <h6 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1" {...props} />
                                ),
                                // 段落
                                p: ({ node, ...props }) => (
                                    <p className="text-gray-800 dark:text-gray-100 my-3 leading-relaxed" {...props} />
                                ),
                                // 列表
                                ul: ({ node, ...props }) => (
                                    <ul className="list-disc list-outside ml-5 text-gray-800 dark:text-gray-100 my-3 space-y-1" {...props} />
                                ),
                                ol: ({ node, ...props }) => (
                                    <ol className="list-decimal list-outside ml-5 text-gray-800 dark:text-gray-100 my-3 space-y-1" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                    <li className="text-gray-800 dark:text-gray-100" {...props} />
                                ),
                                // 文本格式
                                strong: ({ node, ...props }) => (
                                    <strong className="font-bold text-gray-900 dark:text-white" {...props} />
                                ),
                                em: ({ node, ...props }) => (
                                    <em className="italic text-gray-800 dark:text-gray-200" {...props} />
                                ),
                                // 代码
                                code: ({ node, inline, ...props }: any) => 
                                    inline ? (
                                        <code className="bg-bible-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-bible-800 dark:text-bible-200 text-sm font-mono" {...props} />
                                    ) : (
                                        <code className="block bg-bible-100 dark:bg-gray-700 p-3 rounded text-bible-800 dark:text-bible-200 text-sm font-mono my-3 overflow-x-auto" {...props} />
                                    ),
                                // 链接
                                a: ({ node, ...props }) => (
                                    <a className="text-bible-600 dark:text-bible-400 underline hover:text-bible-700 dark:hover:text-bible-300" {...props} />
                                ),
                                // 水平线
                                hr: ({ node, ...props }) => (
                                    <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />
                                ),
                            }}
                        >
                            {value}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="relative h-full">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="w-full h-full p-4 bg-transparent text-bible-800 dark:text-bible-200 font-chinese text-base resize-none focus:outline-none"
                            style={{ 
                                minHeight: typeof window !== 'undefined' && window.innerWidth < 768 
                                    ? 'calc(100vh - 320px)' 
                                    : '400px', 
                                fontSize: '16px' 
                            }}
                        />
                        {/* 自动补全 */}
                        {suggestions.length > 0 && (
                            <VerseAutocomplete
                                suggestions={suggestions}
                                onSelect={handleSelectSuggestion}
                                position={autocompletePosition}
                                selectedIndex={selectedSuggestionIndex}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
