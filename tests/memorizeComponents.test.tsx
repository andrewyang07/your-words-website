// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import MemorizePageClient, { AlphabetKeyboard, MEMORIZE_KEYBOARD_LAYOUT_STORAGE_KEY, VerseExercise, resolveMemorizeSourceIds } from '../components/memorize/MemorizePageClient';
import { CompletionReward } from '../components/memorize/CompletionReward';
import { buildMemorizationSession, pressInitial, singleInitialInput } from '../lib/memorize/session';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { useAppStore } from '../stores/useAppStore';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() { return values.size; },
  });
  useFavoritesStore.persist.setOptions({
    storage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
  useAppStore.persist.setOptions({
    storage: createJSONStorage(() => ({
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    })),
  });
  useAppStore.setState({ language: 'simplified', theme: 'system' });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('dark');
  window.history.replaceState({}, '', '/');
});

async function returnToPreviousStage(
  view: ReturnType<typeof render>,
  currentInstruction: string,
  previousInstruction: string,
) {
  await view.findByRole('heading', { name: currentInstruction });
  fireEvent.click(view.getByRole('button', { name: '返回上一步' }));
  await view.findByRole('heading', { name: previousInstruction });
}

describe('deep memorization controls', () => {
  it('introduces one-verse, four-stage practice once and remembers a skipped guide', async () => {
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));

    const firstVisit = render(<MemorizePageClient />);
    expect(await firstVisit.findByRole('dialog', { name: '这样开始深度背诵' })).toBeTruthy();
    expect(firstVisit.getByText('一轮只练一节经文')).toBeTruthy();
    expect(firstVisit.getAllByText('通读').length).toBeGreaterThan(0);
    expect(firstVisit.getAllByText('轻遮').length).toBeGreaterThan(0);
    expect(firstVisit.getAllByText('深遮').length).toBeGreaterThan(0);
    expect(firstVisit.getAllByText('首字母').length).toBeGreaterThan(0);
    fireEvent.click(firstVisit.getByRole('button', { name: '跳过引导' }));
    expect(firstVisit.queryByRole('dialog')).toBeNull();
    firstVisit.unmount();

    const returningVisit = render(<MemorizePageClient />);
    await returningVisit.findByRole('heading', { name: '选择一节，慢慢记住' });
    expect(returningVisit.queryByRole('dialog')).toBeNull();
  });

  it('keeps Help reachable and replays the complete guide in simplified Chinese', async () => {
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('dialog', { name: '这样开始深度背诵' });
    fireEvent.click(view.getByRole('button', { name: '跳过引导' }));
    fireEvent.click(view.getByRole('button', { name: '帮助' }));
    expect(view.getByRole('dialog', { name: '这样开始深度背诵' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '下一步：输入提示' }));
    expect(view.getByRole('dialog', { name: '逐字回想时' })).toBeTruthy();
    expect(view.getByText('按键错误不会前进；连续两次后会提示正确按键。')).toBeTruthy();
    expect(view.getByText('想不起来时，可以“显示这个字”，也可以跳过当前阶段。')).toBeTruthy();
  });

  it('shows the input coach in context and localizes it in Traditional Chinese', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    useAppStore.setState({ language: 'traditional' });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 約翰福音: { 3: { 16: '神愛世人。' } }, 约翰福音: { 3: { 16: '神愛世人。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先讀一遍，不急著記' });
    expect(view.getByRole('button', { name: '幫助' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '繼續' }));
    expect(await view.findByRole('dialog', { name: '逐字回想時' })).toBeTruthy();
    expect(view.getByRole('button', { name: '跳過引導' })).toBeTruthy();
    const hiddenWhileReadingHelp = view.container.querySelectorAll('.memorize-hidden').length;
    fireEvent.keyDown(window, { key: 's' });
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(hiddenWhileReadingHelp);
  });

  it('announces an independently completed stage with a factual simplified seal', () => {
    const view = render(<CompletionReward kind="stage" language="simplified" assistanceCount={0} skippedStageCount={0} />);

    expect(view.getByRole('status').textContent).toContain('熟记');
    expect(view.getByRole('status').textContent).toContain('本阶段未使用提示，已独立完成');
    expect(view.getByLabelText('熟记朱印')).toBeTruthy();
  });

  it('uses a lighter traditional seal after assisted stage completion', () => {
    const view = render(<CompletionReward kind="stage" language="traditional" assistanceCount={2} skippedStageCount={0} />);

    expect(view.getByRole('status').textContent).toContain('漸熟');
    expect(view.getByRole('status').textContent).toContain('本階段借助了 2 次提示，繼續慢慢熟悉');
    expect(view.getByLabelText('漸熟朱印')).toBeTruthy();
  });

  it('reports a skipped stage statically without a mastery seal', () => {
    const view = render(<CompletionReward kind="stage" language="simplified" assistanceCount={0} skippedStageCount={1} />);

    expect(view.getByRole('status').textContent).toBe('本阶段已跳过，不计作完成。');
    expect(view.queryByRole('img')).toBeNull();
  });

  it('announces current-round assistance and skips with the full-round seal', () => {
    const view = render(<CompletionReward kind="round" language="simplified" assistanceCount={3} skippedStageCount={1} />);

    expect(view.getByRole('status').textContent).toContain('藏于心');
    expect(view.getByRole('status').textContent).toContain('本轮使用了 3 次提示，跳过了 1 个阶段');
    expect(view.getByLabelText('藏于心朱印')).toBeTruthy();
  });

  it('keeps traditional completion semantics in reduced-motion mode', () => {
    const view = render(<CompletionReward kind="round" language="traditional" assistanceCount={0} skippedStageCount={0} reducedMotion />);

    expect(view.getByRole('status').textContent).toContain('藏於心');
    expect(view.getByRole('status').textContent).toContain('本輪未使用提示，也沒有跳過階段');
    expect(view.getByLabelText('藏於心朱印')).toBeTruthy();
  });

  it('shows stage feedback and a factual round summary without delaying controls', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByText('本阶段未使用提示，已独立完成。');

    const continueButton = view.getByRole('button', { name: '继续' });
    expect(continueButton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(continueButton);
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    fireEvent.click(view.getByRole('button', { name: '显示这个字' }));
    await view.findByText('本阶段借助了 1 次提示，继续慢慢熟悉。');

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });
    fireEvent.click(view.getByRole('button', { name: '跳过本轮' }));
    await view.findByText('本轮使用了 1 次提示，跳过了 1 个阶段。');
    expect(view.getByRole('button', { name: '重新背诵' }).hasAttribute('disabled')).toBe(false);
  });

  it('snapshots traditional Scripture and copy when a session starts', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    useAppStore.setState({ language: 'traditional' });
    const fetchBible = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: url.includes('CUVT') ? '神愛世人。' : '神爱世人。' } },
      }),
    }));
    vi.stubGlobal('fetch', fetchBible);

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先讀一遍，不急著記' });
    expect(view.container.querySelector('.memorize-verse')?.textContent).toBe('神愛世人。');
    expect(fetchBible).toHaveBeenCalledWith('/data/CUVT_bible.json');

    act(() => useAppStore.setState({ language: 'simplified' }));
    expect(view.getByRole('heading', { name: '先讀一遍，不急著記' })).toBeTruthy();
    expect(view.container.querySelector('.memorize-verse')?.textContent).toBe('神愛世人。');
  });

  it('uses the latest language after leaving the current session', async () => {
    useFavoritesStore.setState({ favorites: new Set(['约翰福音-3-16']) });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: url.includes('CUVT') ? '神愛世人。' : '神爱世人。' } },
      }),
    })));

    const view = render(<MemorizePageClient />);
    const simplifiedVerse = await view.findByRole('button', { name: /神爱世人/ });
    fireEvent.click(simplifiedVerse);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });

    act(() => useAppStore.setState({ language: 'traditional' }));
    expect(view.getByRole('heading', { name: '先读一遍，不急着记' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '返回经文列表' }));

    const traditionalVerse = await view.findByRole('button', { name: /神愛世人/ });
    fireEvent.click(traditionalVerse);
    await view.findByRole('heading', { name: '先讀一遍，不急著記' });
    expect(view.container.querySelector('.memorize-verse')?.textContent).toBe('神愛世人。');
  });

  it('uses the latest language when retrying a completed session', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    const fetchBible = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: url.includes('CUVT') ? '神愛世人。' : '神爱世人。' } },
      }),
    }));
    vi.stubGlobal('fetch', fetchBible);

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

    act(() => useAppStore.setState({ language: 'traditional' }));
    expect(view.getByRole('heading', { name: '本轮结束' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '重新背诵' }));

    await view.findByRole('heading', { name: '先讀一遍，不急著記' });
    expect(view.container.querySelector('.memorize-verse')?.textContent).toBe('神愛世人。');
    expect(fetchBible).toHaveBeenCalledWith('/data/CUVT_bible.json');
  });

  it('follows light, dark, and live system theme changes', async () => {
    let systemDark = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() { return systemDark; },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })));
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));

    render(<MemorizePageClient />);
    await act(async () => undefined);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => useAppStore.setState({ theme: 'dark' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    act(() => useAppStore.setState({ theme: 'light' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => useAppStore.setState({ theme: 'system' }));
    systemDark = true;
    act(() => listeners.forEach((listener) => listener()));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
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
    const view = render(<AlphabetKeyboard hintedInitials={['s']} onPress={onPress} />);
    fireEvent.click(view.getByRole('button', { name: 'QWERTY' }));
    fireEvent.click(view.getByRole('button', { name: 'Q' }));
    expect(view.getByLabelText('QWERTY键盘').textContent).toContain('QWERTYUIOP');
    expect(view.getByRole('button', { name: 'S' }).getAttribute('data-hinted')).toBe('true');
    expect(onPress).toHaveBeenCalledWith({ kind: 'single', initial: 'q' });
  });

  it('handles physical desktop letters through the same keyboard seam', () => {
    const onPress = vi.fn();
    render(<AlphabetKeyboard onPress={onPress} />);
    fireEvent.keyDown(window, { key: 'r' });
    expect(onPress).toHaveBeenCalledWith({ kind: 'single', initial: 'r' });
  });

  it('offers all 37 Taiwan DaChen symbols and submits one first symbol', () => {
    const onPress = vi.fn();
    const view = render(<AlphabetKeyboard onPress={onPress} />);

    fireEvent.click(view.getByRole('button', { name: '注音' }));
    const keyboard = view.getByLabelText('注音键盘');
    expect(keyboard.querySelectorAll('button[data-zhuyin-symbol]')).toHaveLength(37);
    const key = view.getByRole('button', { name: 'ㄕ G' });
    expect(key.className).toContain('min-h-11');
    fireEvent.click(key);
    expect(onPress).toHaveBeenCalledWith({ kind: 'single', initial: 'ㄕ' });
  });

  it('maps physical DaChen keys only while Zhuyin is selected', () => {
    const onPress = vi.fn();
    const view = render(<AlphabetKeyboard onPress={onPress} />);

    fireEvent.keyDown(window, { key: 'g' });
    expect(onPress).toHaveBeenLastCalledWith({ kind: 'single', initial: 'g' });
    fireEvent.click(view.getByRole('button', { name: '注音' }));
    fireEvent.keyDown(window, { key: 'g' });
    expect(onPress).toHaveBeenLastCalledWith({ kind: 'single', initial: 'ㄕ' });
    fireEvent.keyDown(window, { key: '4' });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('restores the last keyboard layout on this device', async () => {
    const first = render(<AlphabetKeyboard onPress={vi.fn()} />);
    fireEvent.click(first.getByRole('button', { name: '注音' }));
    expect(window.localStorage.getItem(MEMORIZE_KEYBOARD_LAYOUT_STORAGE_KEY)).toBe('zhuyin');
    first.unmount();

    const returning = render(<AlphabetKeyboard onPress={vi.fn()} />);
    await act(async () => undefined);
    expect(returning.getByRole('button', { name: '注音' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('can show and hide standard physical key positions without changing symbols', () => {
    const view = render(<AlphabetKeyboard onPress={vi.fn()} />);
    fireEvent.click(view.getByRole('button', { name: '注音' }));
    expect(view.getByRole('button', { name: 'ㄕ G' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '隐藏实体键位' }));
    expect(view.getByRole('button', { name: 'ㄕ' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '显示实体键位' }));
    expect(view.getByRole('button', { name: 'ㄕ G' })).toBeTruthy();
  });

  it('coaches the first Zhuyin switch with a concrete first-symbol example and replays it from Help', async () => {
    window.localStorage.setItem('your-words:memorize-guide:v3', JSON.stringify({
      version: 3,
      pickerSeen: true,
      inputSeen: true,
      zhuyinSeen: false,
      dismissed: false,
    }));
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神爱世人。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    fireEvent.click(view.getByRole('button', { name: '注音' }));
    expect(view.getByRole('dialog', { name: '注音只按第一个符号' })).toBeTruthy();
    expect(view.getByText('神 shén → ㄕ')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '知道了' }));

    fireEvent.click(view.getByRole('button', { name: '帮助' }));
    fireEvent.click(view.getByRole('button', { name: '只看注音说明' }));
    expect(view.getByRole('dialog', { name: '注音只按第一个符号' })).toBeTruthy();
  });

  it('completes page recall with Zhuyin and highlights its correct key after two errors', async () => {
    window.localStorage.setItem('your-words:memorize-guide:v3', JSON.stringify({
      version: 3,
      pickerSeen: true,
      inputSeen: true,
      zhuyinSeen: true,
      dismissed: true,
    }));
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });

    fireEvent.click(view.getByRole('button', { name: '注音' }));
    expect(view.getByRole('heading', { name: '按每个字读音的第一个注音符号' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'ㄅ 1' }));
    fireEvent.click(view.getByRole('button', { name: 'ㄅ 1' }));
    expect(view.getByRole('button', { name: 'ㄕ G' }).getAttribute('data-hinted')).toBe('true');
    fireEvent.click(view.getByRole('button', { name: 'ㄕ G' }));
    await view.findByRole('heading', { name: '本轮结束' });
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

  it('announces an error and highlights the correct key after two wrong attempts', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神是世上。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });

    fireEvent.click(view.getByRole('button', { name: '9 WXYZ' }));
    expect(view.getByRole('status').textContent).toContain('再试一次');
    fireEvent.click(view.getByRole('button', { name: '9 WXYZ' }));
    expect(view.getByRole('button', { name: '7 PQRS' }).getAttribute('data-hinted')).toBe('true');
  });

  it('offers one-unit reveal in every input stage', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神爱世人。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    const partialHidden = view.container.querySelectorAll('.memorize-hidden').length;
    fireEvent.click(view.getByRole('button', { name: '显示这个字' }));
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(partialHidden - 1);

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    expect(view.getByRole('button', { name: '显示这个字' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });
    expect(view.getByRole('button', { name: '显示这个字' })).toBeTruthy();
  });

  it('keeps a skipped input stage usable when navigating back', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神爱世人。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    fireEvent.click(view.getByRole('button', { name: '返回上一步' }));

    const hiddenBeforeReveal = view.container.querySelectorAll('.memorize-hidden').length;
    fireEvent.click(view.getByRole('button', { name: '显示这个字' }));
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(hiddenBeforeReveal - 1);
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

  it('lets the user return from every later stage without leaving the session', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: '神爱世人。' } },
      }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    expect(view.getByRole('button', { name: '返回经文列表' })).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await returnToPreviousStage(view, '凭留下的字，补全句子', '先读一遍，不急着记');

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await returnToPreviousStage(view, '只留少量线索，再想一遍', '凭留下的字，补全句子');

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await returnToPreviousStage(view, '按每个字的拼音首字母', '只留少量线索，再想一遍');
  });

  it('lets the user spell and reveal masked characters from the first masked stage', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: '神是世上。' } },
      }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });

    expect(await view.findByLabelText('拼音首字母键盘')).toBeTruthy();
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(1);
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(0);

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(3);
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    expect(view.container.querySelectorAll('.memorize-hidden')).toHaveLength(2);
  });

  it('keeps exit in the header and places previous-stage navigation directly below the keyboard', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: '神爱世人。' } },
      }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });

    const exit = view.getByRole('button', { name: '返回经文列表' });
    const keyboard = await view.findByLabelText('拼音首字母键盘');
    const previous = view.getByRole('button', { name: '返回上一步' });
    expect(exit.closest('header')).toBeTruthy();
    expect(keyboard.nextElementSibling).toBe(previous);

    fireEvent.click(exit);
    expect(await view.findByText('先收藏一节想背的经文')).toBeTruthy();
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
