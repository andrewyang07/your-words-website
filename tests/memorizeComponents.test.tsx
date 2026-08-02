// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MemorizePageClient, { AlphabetKeyboard, VerseExercise, resolveMemorizeSourceIds } from '../components/memorize/MemorizePageClient';
import { buildMemorizationSession, pressInitial, singleInitialInput } from '../lib/memorize/session';
import { useFavoritesStore } from '../stores/useFavoritesStore';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('deep memorization controls', () => {
  it('offers a T9 keyboard by default and accepts grouped initials', () => {
    const onPress = vi.fn();
    const { getByRole } = render(<AlphabetKeyboard onPress={onPress} />);

    const key = getByRole('button', { name: '2 ABC' });
    expect(key.className).toContain('min-h-14');
    fireEvent.click(key);
    expect(onPress).toHaveBeenCalledWith({ kind: 'group', initials: ['a', 'b', 'c'] });
  });

  it('switches to a conventional QWERTY layout', () => {
    const onPress = vi.fn();
    const view = render(<AlphabetKeyboard onPress={onPress} />);
    fireEvent.click(view.getByRole('button', { name: 'QWERTY' }));
    fireEvent.click(view.getByRole('button', { name: 'Q' }));
    expect(view.getByLabelText('QWERTY键盘').textContent).toContain('QWERTYUIOP');
    expect(onPress).toHaveBeenCalledWith({ kind: 'single', initial: 'q' });
  });

  it('handles physical desktop letters through the same keyboard seam', () => {
    const onPress = vi.fn();
    render(<AlphabetKeyboard onPress={onPress} />);
    fireEvent.keyDown(window, { key: 'r' });
    expect(onPress).toHaveBeenCalledWith({ kind: 'single', initial: 'r' });
  });

  it('reveals exactly one Han character after one correct initial', () => {
    const session = buildMemorizationSession('神爱世人。', 'component', [['s'], ['a'], ['s'], ['r']]);
    const view = render(<VerseExercise session={session} stage={3} />);
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(4);

    const advanced = { ...session, recall: pressInitial(session.recall, session.units, singleInitialInput('s')) };
    view.rerender(<VerseExercise session={advanced} stage={3} />);
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(3);
    expect(view.container.querySelectorAll('.memorize-revealed')).toHaveLength(1);
  });

  it('keeps revealed text intact after a wrong on-screen key', () => {
    const initial = buildMemorizationSession('神爱。', 'wrong-key', [['s'], ['a']]);
    function RecallHarness() {
      const [session, setSession] = React.useState(initial);
      return <><VerseExercise session={session} stage={3} /><AlphabetKeyboard onPress={(input) => setSession((current) => ({ ...current, recall: pressInitial(current.recall, current.units, input) }))} /></>;
    }

    const view = render(<RecallHarness />);
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    expect(view.container.querySelectorAll('.memorize-revealed')).toHaveLength(1);
    fireEvent.click(view.getByRole('button', { name: '9 WXYZ' }));
    expect(view.container.querySelectorAll('.memorize-revealed')).toHaveLength(1);
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(1);
    expect(view.container.querySelector('.memorize-verse')?.classList.contains('memorize-wrong')).toBe(true);
  });

  it('opens a shared verse directly without requiring it in favorites', () => {
    expect(resolveMemorizeSourceIds('?v=43-3-16', [])).toEqual({
      ids: ['约翰福音-3-16'],
      directId: '约翰福音-3-16',
    });
  });

  it('keeps favorites available alongside a direct shared verse', () => {
    expect(resolveMemorizeSourceIds('?v=43-3-16', ['诗篇-23-1'])).toEqual({
      ids: ['约翰福音-3-16', '诗篇-23-1'],
      directId: '约翰福音-3-16',
    });
  });

  it('opens a non-favorite share, skips every stage, then returns to favorites', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set(['诗篇-23-1']) });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: '神爱世人。' } },
        诗篇: { 23: { 1: '耶和华是我的牧者。' } },
      }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });
    fireEvent.click(view.getByRole('button', { name: '跳过本轮' }));
    await view.findByRole('heading', { name: '本轮结束' });

    fireEvent.click(view.getByRole('button', { name: '选择另一节' }));
    expect(await view.findByText('耶和华是我的牧者。')).toBeTruthy();
  });
});
