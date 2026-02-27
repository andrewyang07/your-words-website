'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Heading2, Quote, List, ListOrdered, Minus } from 'lucide-react';
import { BibleSuggestion } from './extensions/BibleSuggestion';
import { SlashCommand } from './extensions/SlashCommand';
import { getSlashCommandItems } from './extensions/SlashCommandList';
import { searchVerses, isSearchReady, type SuggestionItem } from '@/lib/editorSearch';
import { getVerseText } from '@/lib/verseLoader';
import { renderSuggestionPopup, type SuggestionPopupRef } from './extensions/suggestionRenderer';

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

  if (!editor) return null;

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
          title="粗体"
        >
          <Bold className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="标题"
        >
          <Heading2 className="w-4 h-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote className="w-4 h-4" />
        </BubbleButton>
      </BubbleMenu>

      {/* Floating menu - appears on empty lines */}
      <FloatingMenu
        editor={editor}
        options={{ placement: 'left' }}
        className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-bible-200 dark:border-gray-700 p-1 opacity-50 hover:opacity-100 transition-opacity"
      >
        <BubbleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={false}
          title="标题"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={false}
          title="列表"
        >
          <List className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={false}
          title="有序列表"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={false}
          title="引用"
        >
          <Quote className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          title="分割线"
        >
          <Minus className="w-3.5 h-3.5" />
        </BubbleButton>
      </FloatingMenu>

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
