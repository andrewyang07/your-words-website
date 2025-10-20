'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Heading, Quote, List, ListOrdered, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import VerseAutocomplete from './VerseAutocomplete';

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
                console.log('[Autocomplete] Loaded books:', booksList.length);
                setBibleBooks(booksList);
            })
            .catch((error) => {
                console.error('Error loading books:', error);
            });
    }, []);

    // 检测经文引用模式并生成建议
    const updateSuggestions = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea || !bibleBooks) {
            console.log('[Autocomplete] Not ready:', { textarea: !!textarea, bibleBooks: !!bibleBooks });
            return;
        }

        const selectionStart = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, selectionStart);

        console.log('[Autocomplete] Text before cursor:', textBeforeCursor.slice(-20));

        // 匹配模式: 
        // 1. "路加福音2:1" -> bookName="路加福音", chapter="2", verse="1"
        // 2. "路加福音2:" -> bookName="路加福音", chapter="2", verse=""
        // 3. "路加福音" -> bookName="路加福音", chapter="", verse=""
        // 4. "路1:1" -> bookName="路", chapter="1", verse="1" (模糊匹配)
        const match = textBeforeCursor.match(/([\u4e00-\u9fa5]+)(\d+)?:?(\d+)?$/);

        if (!match) {
            console.log('[Autocomplete] No match');
            setSuggestions([]);
            return;
        }

        const [fullMatch, bookName, chapterNum, verseNum] = match;
        console.log('[Autocomplete] Matched:', { fullMatch, bookName, chapterNum, verseNum });

        // 查找匹配的书卷 (支持模糊搜索)
        const matchedBooks = bibleBooks.filter((book: any) => {
            const traditional = book.nameTraditional || '';
            const simplified = book.nameSimplified || '';
            const key = book.key || '';
            
            // 精确匹配
            if (traditional.includes(bookName) || simplified.includes(bookName) || key.includes(bookName)) {
                return true;
            }
            
            // 模糊匹配：检查书名的第一个字符
            if (bookName.length === 1) {
                return traditional.startsWith(bookName) || simplified.startsWith(bookName) || key.startsWith(bookName);
            }
            
            // 模糊匹配：检查书名是否包含在完整书名中
            if (bookName.length >= 2) {
                return traditional.includes(bookName) || simplified.includes(bookName) || key.includes(bookName);
            }
            
            return false;
        });

        console.log('[Autocomplete] Matched books:', matchedBooks.length);

        if (matchedBooks.length === 0) {
            setSuggestions([]);
            return;
        }

        const newSuggestions: VerseSuggestion[] = [];

        matchedBooks.forEach((book: any) => {
            const bookDisplayName = book.nameTraditional || book.key;
            const bookKey = book.key;

            if (chapterNum) {
                // 如果输入了章节号，显示该章的经文（1-20节）
                const chapter = parseInt(chapterNum, 10);
                if (chapter >= 1 && chapter <= book.chapters) {
                    // 显示该章的前20节经文
                    for (let v = 1; v <= 20; v++) {
                        newSuggestions.push({
                            display: `${bookDisplayName} ${chapter}:${v}`,
                            insert: `${bookKey}${chapter}:${v}`,
                            book: bookKey,
                            chapter,
                            verse: v,
                        });
                    }
                }
            } else {
                // 如果只输入了书卷名，默认显示第1章的经文（1-20节）
                const chapter = 1;
                for (let v = 1; v <= 20; v++) {
                    newSuggestions.push({
                        display: `${bookDisplayName} ${chapter}:${v}`,
                        insert: `${bookKey}${chapter}:${v}`,
                        book: bookKey,
                        chapter,
                        verse: v,
                    });
                }
            }
        });

        // 限制显示数量
        const finalSuggestions = newSuggestions.slice(0, 20);
        console.log('[Autocomplete] Final suggestions:', finalSuggestions.length);

        setSuggestions(finalSuggestions);
        setSelectedSuggestionIndex(0);

        // 计算 autocomplete 位置
        if (finalSuggestions.length > 0) {
            // 获取光标在 textarea 中的位置
            const textareaRect = textarea.getBoundingClientRect();
            const textareaStyle = window.getComputedStyle(textarea);

            // 计算字符宽度和行高
            const fontSize = parseInt(textareaStyle.fontSize, 10);
            const lineHeight = fontSize * 1.2; // 假设行高是字体的1.2倍
            const charWidth = fontSize * 0.6; // 中文字符宽度大约是字体的0.6倍

            // 获取光标位置
            const cursorPos = textarea.selectionStart;
            const textBeforeCursor = value.substring(0, cursorPos);

            // 计算光标所在的行和列
            const lines = textBeforeCursor.split('\n');
            const currentLineIndex = lines.length - 1;
            const currentLineText = lines[currentLineIndex];

            // 计算光标在 textarea 中的相对位置
            const paddingTop = parseInt(textareaStyle.paddingTop, 10) || 0;
            const paddingLeft = parseInt(textareaStyle.paddingLeft, 10) || 0;

            const cursorX = paddingLeft + currentLineText.length * charWidth;
            const cursorY = paddingTop + (currentLineIndex + 1) * lineHeight;

            // 转换为页面坐标
            const top = textareaRect.top + cursorY + window.scrollY + 2;
            const left = textareaRect.left + cursorX + window.scrollX;

            console.log('[Autocomplete] Position:', {
                top,
                left,
                cursorPos,
                currentLineIndex,
                currentLineText: currentLineText.slice(-10),
            });
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
                    <div className="h-full overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{value}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="relative h-full">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="w-full h-full p-4 bg-transparent text-bible-800 dark:text-bible-200 font-chinese text-sm resize-none focus:outline-none"
                            style={{ minHeight: '400px' }}
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
