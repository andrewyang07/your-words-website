// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { displayNoteTitle, extractTitle } from '../lib/noteStorage';
import { createMdxEditorTranslation } from '../lib/mdxEditorI18n';
import NoteList from '../components/bible-note/NoteList';
import { NoteEditorLoading } from '../components/bible-note/BibleNoteClient';
import { useAppStore } from '../stores/useAppStore';

vi.mock('../lib/noteStorage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/noteStorage')>()),
  getAllNotes: async () => [{ id: 'n1', title: '旧标题&#x20;', updatedAt: Date.now() }],
}));

afterEach(() => cleanup());
beforeEach(() => useAppStore.setState({ language: 'simplified' }));

describe('note titles', () => {
  it('does not leak MDXEditor entities (&#x20;) or escapes into titles', () => {
    expect(extractTitle('# 主日讲道&#x20;\n正文')).toBe('主日讲道');
    expect(extractTitle('&#x20;\n\n读经 \\* 祷告')).toBe('读经 * 祷告');
    expect(displayNoteTitle('读经笔记&#x20;', 'simplified')).toBe('读经笔记');
  });

  it('localizes the untitled placeholder', () => {
    expect(extractTitle('')).toBe('无标题');
    expect(displayNoteTitle('无标题', 'traditional')).toBe('無標題');
  });
});

describe('note list', () => {
  it('shows the live title of the open note and an always-visible delete button', async () => {
    const view = render(
      <NoteList
        isOpen
        onClose={() => {}}
        currentNoteId="n1"
        onSelectNote={() => {}}
        onNewNote={() => {}}
        currentTitle="新标题"
      />,
    );
    // Other notes / not-yet-edited titles are cleaned too (covered by displayNoteTitle).
    await waitFor(() => expect(view.getByText('新标题')).toBeTruthy());
    expect(view.queryByText('旧标题')).toBeNull();
    const del = view.getByRole('button', { name: '删除笔记' });
    // Not hover-only: no unconditional opacity-0, touch-sized target.
    expect(del.className).not.toMatch(/(^|\s)opacity-0(\s|$)/);
    expect(del.className).toContain('min-h-[44px]');
  });
});

describe('note list keyboard', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<NoteList isOpen onClose={onClose} currentNoteId="n1" onSelectNote={() => {}} onNewNote={() => {}} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('editor', () => {
  it('labels the editable area in Chinese (not "editable markdown")', () => {
    expect(createMdxEditorTranslation('simplified')('contentArea.editableMarkdown', 'editable markdown')).toBe(
      '笔记内容编辑区',
    );
    expect(createMdxEditorTranslation('traditional')('contentArea.editableMarkdown', 'editable markdown')).toBe(
      '筆記內容編輯區',
    );
  });

  it('shows the note content while the editor chunk loads, in the active script', () => {
    useAppStore.setState({ language: 'traditional' });
    const view = render(<NoteEditorLoading content={'# 我的筆記\n內容'} />);
    expect(view.container.textContent).toContain('內容');
    expect(view.container.textContent).toContain('正在載入編輯器');
    expect(view.container.textContent).not.toContain('筆記紙');
  });
});
