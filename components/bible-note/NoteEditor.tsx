'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Heading2, Quote, List, ListOrdered, Minus, Undo2, Redo2 } from 'lucide-react';
import { BibleSuggestion } from './extensions/BibleSuggestion';
import { SlashCommand } from './extensions/SlashCommand';
import { getSlashCommandItems } from './extensions/SlashCommandList';
import { searchVerses, isSearchReady, type SuggestionItem } from '@/lib/editorSearch';
import { getVerseText } from '@/lib/verseLoader';
import { renderSuggestionPopup, type SuggestionPopupRef } from './extensions/suggestionRenderer';

function shortcutLabel(key: string): string {
  if (typeof navigator === 'undefined') return `Ctrl+${key}`;
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? `⌘${key}` : `Ctrl+${key}`;
}

interface NoteEditorProps {
  content: string;
  onChange: (md: string) => void;
  onExpandVerse?: (book: string, chapter: number, verse: number) => Promise<string | null>;
}

export default function NoteEditor({ content, onChange, onExpandVerse }: NoteEditorProps) {
  const [isReady, setIsReady] = useState(false);
  const contentRef = useRef(content);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Keep a ref to prevent reinitializing editor on every content change
  const initialContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: '開始記錄你的靈修筆記…\n\n輸入 @ 搜索經文，輸入 / 查看命令',
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      BibleSuggestion.configure({
        suggestion: {
          char: '@',
          allowSpaces: true,
          items: async ({ query }) => {
            if (!query || query.length < 1) return [];
            try {
              return await searchVerses(query);
            } catch {
              return [];
            }
          },
          command: ({ editor, range, props: item }) => {
            const suggestionItem = item as unknown as SuggestionItem;
            // Delete the @query text
            editor.chain().focus().deleteRange(range).run();

            // Insert verse reference and auto-expand
            const ref = suggestionItem.reference;

            if (onExpandVerse) {
              void getVerseText(suggestionItem.bookKey, suggestionItem.chapter, suggestionItem.verse).then(
                (text) => {
                  if (text) {
                    editor
                      .chain()
                      .focus()
                      .insertContent(`${ref}\n\n> ${ref}: ${text}\n\n`)
                      .run();
                  } else {
                    editor.chain().focus().insertContent(`${ref} `).run();
                  }
                }
              );
            } else {
              editor.chain().focus().insertContent(`${ref} `).run();
            }
          },
          render: () => renderSuggestionPopup('bible'),
        },
      }),
      SlashCommand.configure({
        suggestion: {
          char: '/',
          startOfLine: true,
          items: ({ query }) => getSlashCommandItems(query),
          command: ({ editor, range, props: item }) => {
            (item as any).command({ editor, range });
          },
          render: () => renderSuggestionPopup('slash'),
        },
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4 font-chinese text-base leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      const md = (editor.storage as any).markdown.getMarkdown();
      contentRef.current = md;
      onChangeRef.current(md);
    },
  });

  // Load initial content once editor is ready
  useEffect(() => {
    if (editor && !isReady) {
      if (initialContentRef.current) {
        editor.commands.setContent(initialContentRef.current);
      }
      setIsReady(true);
    }
  }, [editor, isReady]);

  // When content prop changes externally (e.g. switching notes), update the editor
  useEffect(() => {
    if (editor && isReady && content !== contentRef.current) {
      contentRef.current = content;
      editor.commands.setContent(content);
    }
  }, [editor, isReady, content]);

  if (!editor) {
    return (
      <div className="flex flex-col h-full animate-pulse">
        <div className="border-b border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-900 p-2 flex items-center gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-7 h-7 rounded bg-bible-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="flex-1 px-6 py-4 space-y-3">
          <div className="h-4 bg-bible-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-bible-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-bible-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-bible-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Bubble menu - appears on text selection */}
      <BubbleMenu
        editor={editor}
        options={{ placement: 'top' }}
        className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 p-1"
      >
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={`粗体 (${shortcutLabel('B')})`}
        >
          <Bold className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={`斜体 (${shortcutLabel('I')})`}
        >
          <Italic className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title={`标题 (${shortcutLabel('Alt+2')})`}
        >
          <Heading2 className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={`引用 (${shortcutLabel('Shift+B')})`}
        >
          <Quote className="w-4 h-4" />
        </BubbleButton>
      </BubbleMenu>

      {/* Static toolbar */}
      <div className="border-b border-bible-200 dark:border-gray-700 bg-bible-50 dark:bg-gray-900 p-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <BubbleButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          title={`撤銷 (${shortcutLabel('Z')})`}
        >
          <Undo2 className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          title={`重做 (${shortcutLabel('Shift+Z')})`}
        >
          <Redo2 className="w-4 h-4" />
        </BubbleButton>
        <div className="w-px h-5 bg-bible-200 dark:bg-gray-700 mx-0.5" />
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={`粗体 (${shortcutLabel('B')})`}
        >
          <Bold className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={`斜体 (${shortcutLabel('I')})`}
        >
          <Italic className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title={`标题 (${shortcutLabel('Alt+2')})`}
        >
          <Heading2 className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={`引用 (${shortcutLabel('Shift+B')})`}
        >
          <Quote className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={`列表 (${shortcutLabel('Shift+8')})`}
        >
          <List className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={`有序列表 (${shortcutLabel('Shift+7')})`}
        >
          <ListOrdered className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          title="分割线"
        >
          <Minus className="w-4 h-4" />
        </BubbleButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}

function BubbleButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-bible-200 dark:bg-gray-600 text-bible-800 dark:text-bible-200'
          : 'text-bible-600 dark:text-bible-400 hover:bg-bible-100 dark:hover:bg-gray-700'
      }`}
      title={title}
    >
      {children}
    </button>
  );
}
