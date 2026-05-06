'use client';

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CreateLink,
    InsertThematicBreak,
    ListsToggle,
    MDXEditor,
    type MDXEditorMethods,
    Separator,
    UndoRedo,
    headingsPlugin,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
} from '@mdxeditor/editor';

interface NoteEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export interface NoteEditorHandle {
    insertMarkdownAtCursor: (markdown: string) => boolean;
}

const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(function NoteEditor({ content, onChange }, ref) {
    const editorRef = useRef<MDXEditorMethods>(null);
    const latestMarkdownRef = useRef(content);

    useEffect(() => {
        if (content === latestMarkdownRef.current) return;
        latestMarkdownRef.current = content;
        editorRef.current?.setMarkdown(content);
    }, [content]);

    const plugins = useMemo(
        () => [
            headingsPlugin({ allowedHeadingLevels: [2, 3] }),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
                toolbarContents: () => (
                    <>
                        <UndoRedo />
                        <Separator />
                        <BlockTypeSelect />
                        <BoldItalicUnderlineToggles />
                        <ListsToggle />
                        <CreateLink />
                        <InsertThematicBreak />
                    </>
                ),
            }),
        ],
        []
    );

    useImperativeHandle(ref, () => ({
        insertMarkdownAtCursor(markdown: string) {
            const editor = editorRef.current;
            if (!editor) return false;

            editor.focus(undefined, { defaultSelection: 'rootEnd', preventScroll: true });
            editor.insertMarkdown(markdown);
            const nextMarkdown = editor.getMarkdown();
            latestMarkdownRef.current = nextMarkdown;
            onChange(nextMarkdown);
            return true;
        },
    }), [onChange]);

    const handleChange = (markdown: string) => {
        latestMarkdownRef.current = markdown;
        onChange(markdown);
    };

    return (
        <div className="bible-note-mdx-editor overflow-hidden rounded-[1.75rem] border border-stone-200/70 bg-white/85 shadow-[0_24px_80px_rgba(68,64,60,0.08)] backdrop-blur-sm transition-all dark:border-gray-700/60 dark:bg-gray-900/70">
            <MDXEditor
                ref={editorRef}
                markdown={content}
                onChange={handleChange}
                plugins={plugins}
                placeholder={
                    <div className="text-stone-400">
                        開始記錄今天的靈修筆記…
                        <br />
                        <br />
                        直接寫下經文引用，如 約3:16 或 John 3:17
                    </div>
                }
                className="min-h-[620px] text-stone-900 dark:text-gray-100"
                contentEditableClassName="prose prose-stone prose-sm max-w-none min-h-[560px] px-5 py-6 leading-8 focus:outline-none md:px-8 md:py-8 dark:prose-invert"
            />
        </div>
    );
});

export default NoteEditor;
