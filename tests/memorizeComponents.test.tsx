// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import MemorizePageClient, { AlphabetKeyboard, MEMORIZE_KEYBOARD_LAYOUT_STORAGE_KEY, resolveMemorizeSourceIds } from '../components/memorize/MemorizePageClient';
import { CompletionReward } from '../components/memorize/CompletionReward';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { useAppStore } from '../stores/useAppStore';
import AppStoreStorageSync from '../components/AppStoreStorageSync';

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

async function skipStageAndContinue(
  view: ReturnType<typeof render>,
  skipLabel: '跳过' | '跳过本轮' = '跳过',
) {
  fireEvent.click(view.getByRole('button', { name: skipLabel }));
  await view.findByText('本阶段已跳过，不计作完成。');
  fireEvent.click(view.getByRole('button', { name: '继续' }));
}

describe('deep memorization controls', () => {
  it('keeps the global navigation out of the practice focus order only while memorizing', async () => {
    const navigation = document.createElement('nav');
    navigation.setAttribute('aria-label', '主要頁面');
    navigation.innerHTML = '<a href="/search">聖經搜索</a>';
    document.body.append(navigation);
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '选择一节，慢慢记住' });
    expect(view.getByRole('navigation', { name: '主要頁面' }).inert).toBe(true);

    view.unmount();
    expect(navigation.inert).toBe(false);
    navigation.remove();
  });

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
    expect(view.getByRole('progressbar', { name: '第 2 階段，共 4 階段' })).toBeTruthy();
    expect(view.getByRole('button', { name: '跳過引導' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 's' });
    expect(view.getByRole('dialog', { name: '逐字回想時' })).toBeTruthy();
    expect(view.getByRole('status').textContent).toBe('');
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
    await view.findByText('本阶段已跳过，不计作完成。');
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByText('本轮使用了 1 次提示，跳过了 1 个阶段。');
    expect(view.getByRole('button', { name: '重新背诵' }).hasAttribute('disabled')).toBe(false);
  });

  it('acknowledges every skipped stage before continuing, including the final stage', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神爱世人。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });

    for (const nextHeading of ['凭留下的字，补全句子', '只留少量线索，再想一遍', '按每个字的拼音首字母']) {
      fireEvent.click(view.getByRole('button', { name: '跳过' }));
      expect(await view.findByText('本阶段已跳过，不计作完成。')).toBeTruthy();
      expect(view.queryByRole('heading', { name: nextHeading })).toBeNull();
      fireEvent.click(view.getByRole('button', { name: '继续' }));
      await view.findByRole('heading', { name: nextHeading });
    }

    fireEvent.click(view.getByRole('button', { name: '跳过本轮' }));
    expect(await view.findByText('本阶段已跳过，不计作完成。')).toBeTruthy();
    expect(view.queryByRole('heading', { name: '本轮结束' })).toBeNull();
    expect(view.queryByLabelText('藏于心朱印')).toBeNull();
    const continueButton = view.getByRole('button', { name: '继续' });
    expect(continueButton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(continueButton);
    await view.findByRole('heading', { name: '本轮结束' });
    expect(view.getByText('本轮未使用提示，跳过了 4 个阶段。')).toBeTruthy();
  });

  it('does not offer Continue for an incomplete masked stage', async () => {
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

    expect(view.queryByRole('button', { name: '继续' })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: '跳过' }));
    await view.findByText('本阶段已跳过，不计作完成。');
    expect(view.getByRole('button', { name: '继续' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    expect(view.queryByRole('button', { name: '继续' })).toBeNull();
  });

  it('acknowledges independent final-stage completion before the round summary', async () => {
    window.history.replaceState({}, '', '/memorize?v=43-3-16');
    useFavoritesStore.setState({ favorites: new Set() });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ 约翰福音: { 3: { 16: '神。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });

    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    expect(await view.findByText('本阶段未使用提示，已独立完成。')).toBeTruthy();
    expect(view.queryByRole('heading', { name: '本轮结束' })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '本轮结束' });
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
    expect(view.getByText('愛')).toBeTruthy();
    expect(view.queryByText('爱')).toBeNull();
    expect(fetchBible).toHaveBeenCalledWith('/data/CUVT_bible.json');

    act(() => useAppStore.setState({ language: 'simplified' }));
    expect(view.getByRole('heading', { name: '先讀一遍，不急著記' })).toBeTruthy();
    expect(view.getByText('愛')).toBeTruthy();
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
    expect(view.getByText('愛')).toBeTruthy();
    expect(view.queryByText('爱')).toBeNull();
  });

  it('keeps the active session snapshot when another tab changes the persisted language', async () => {
    useFavoritesStore.setState({ favorites: new Set(['约翰福音-3-16']) });
    const fetchBible = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        约翰福音: { 3: { 16: url.includes('CUVT') ? '神愛世人。' : '神爱世人。' } },
      }),
    }));
    vi.stubGlobal('fetch', fetchBible);

    const view = render(<><AppStoreStorageSync /><MemorizePageClient /></>);
    fireEvent.click(await view.findByRole('button', { name: /神爱世人/ }));
    await view.findByRole('heading', { name: '先读一遍，不急着记' });

    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: 'your-words-app',
      newValue: JSON.stringify({ state: { language: 'traditional', theme: 'system' }, version: 0 }),
    })));

    expect(useAppStore.getState().language).toBe('traditional');
    expect(view.getByRole('heading', { name: '先读一遍，不急着记' })).toBeTruthy();
    expect(view.getByText('爱')).toBeTruthy();
    expect(view.queryByText('愛')).toBeNull();

    fireEvent.click(view.getByRole('button', { name: '返回经文列表' }));
    const traditionalVerse = await view.findByRole('button', { name: /神愛世人/ });
    fireEvent.click(traditionalVerse);
    await view.findByRole('heading', { name: '先讀一遍，不急著記' });
    expect(view.getByText('愛')).toBeTruthy();
    expect(fetchBible).toHaveBeenCalledWith('/data/CUVT_bible.json');
  });

  it('keeps an active session usable when a cross-tab language reload fails', async () => {
    useFavoritesStore.setState({ favorites: new Set(['约翰福音-3-16']) });
    const fetchBible = vi.fn(async (url: string) => {
      if (url.includes('CUVT')) throw new Error('CUVT unavailable');
      return {
        ok: true,
        json: async () => ({ 约翰福音: { 3: { 16: '神爱世人。' } } }),
      };
    });
    vi.stubGlobal('fetch', fetchBible);

    const view = render(<><AppStoreStorageSync /><MemorizePageClient /></>);
    fireEvent.click(await view.findByRole('button', { name: /神爱世人/ }));
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });

    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: 'your-words-app',
      newValue: JSON.stringify({ state: { language: 'traditional', theme: 'system' }, version: 0 }),
    })));
    await waitFor(() => expect(fetchBible).toHaveBeenCalledWith('/data/CUVT_bible.json'));

    expect(view.queryByRole('heading', { name: '出錯了' })).toBeNull();
    expect(view.getByRole('heading', { name: '凭留下的字，补全句子' })).toBeTruthy();
    expect(view.getByText('爱')).toBeTruthy();
    expect(view.getByRole('group', { name: '拼音首字母键盘' })).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: '返回经文列表' }));
    expect(await view.findByRole('heading', { name: '出錯了' })).toBeTruthy();
    expect(view.getByText('經文載入失敗')).toBeTruthy();
  });

  it('clears a stale picker error after a cross-tab language change loads successfully', async () => {
    useFavoritesStore.setState({ favorites: new Set(['约翰福音-3-16']) });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('CUV_bible')) throw new Error('CUV unavailable');
      return {
        ok: true,
        json: async () => ({ 约翰福音: { 3: { 16: '神愛世人。' } } }),
      };
    }));

    const view = render(<><AppStoreStorageSync /><MemorizePageClient /></>);
    await view.findByRole('heading', { name: '出错了' });

    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: 'your-words-app',
      newValue: JSON.stringify({ state: { language: 'traditional', theme: 'system' }, version: 0 }),
    })));

    expect(await view.findByRole('button', { name: /神愛世人/ })).toBeTruthy();
    expect(view.queryByRole('heading', { name: '出錯了' })).toBeNull();
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
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });
    await skipStageAndContinue(view, '跳过本轮');
    await view.findByRole('heading', { name: '本轮结束' });

    act(() => useAppStore.setState({ language: 'traditional' }));
    expect(view.getByRole('heading', { name: '本轮结束' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '重新背诵' }));

    await view.findByRole('heading', { name: '先讀一遍，不急著記' });
    expect(view.getByText('愛')).toBeTruthy();
    expect(view.queryByText('爱')).toBeNull();
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
    fireEvent.click(key);
    expect(onPress).toHaveBeenCalledWith({ kind: 'group', initials: ['a', 'b', 'c'] });
  });

  it('exposes localized keyboard regions through valid group semantics', () => {
    const view = render(<AlphabetKeyboard language="traditional" onPress={vi.fn()} />);

    expect(view.getByRole('group', { name: '拼音首字母鍵盤' })).toBeTruthy();
    expect(view.getByRole('group', { name: '九宮格鍵盤' })).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: 'QWERTY' }));
    expect(view.getByRole('group', { name: 'QWERTY 鍵盤' })).toBeTruthy();
  });

  it('switches to a conventional QWERTY layout', () => {
    const onPress = vi.fn();
    const view = render(<AlphabetKeyboard hintedInitials={['s']} onPress={onPress} />);
    fireEvent.click(view.getByRole('button', { name: 'QWERTY' }));
    fireEvent.click(view.getByRole('button', { name: 'Q' }));
    expect(view.getByRole('group', { name: 'QWERTY键盘' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'S，提示按键' })).toBeTruthy();
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
    expect(view.getAllByRole('button', { name: /^[ㄅ-ㄩ]/u })).toHaveLength(37);
    expect(view.getAllByRole('group', { name: /^注音键盘 [1-4]$/u }).map((row) =>
      within(row).getAllByRole('button').length,
    )).toEqual([7, 10, 10, 10]);
    const key = view.getByRole('button', { name: 'ㄕ G' });
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

  it('loads Taiwan-primary readings when Zhuyin is selected', async () => {
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
      json: async () => ({ 约翰福音: { 3: { 16: '蜗。' } } }),
    })));

    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });

    fireEvent.click(view.getByRole('button', { name: '注音' }));
    expect(view.getByRole('heading', { name: '按每个字读音的第一个注音符号' })).toBeTruthy();
    await waitFor(() => expect((view.getByRole('button', { name: 'ㄅ 1' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(view.getByRole('button', { name: 'ㄅ 1' }));
    fireEvent.click(view.getByRole('button', { name: /^ㄅ 1/u }));
    const hintedKey = view.getByRole('button', { name: 'ㄍ E，提示按键' });
    expect(view.getByRole('status').textContent).toContain('提示：请按 ㄍ 或 ㄨ 键');
    fireEvent.click(hintedKey);
    await view.findByText('本阶段借助了 1 次提示，继续慢慢熟悉。');
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '本轮结束' });
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
    fireEvent.click(view.getByRole('button', { name: /^9 WXYZ/u }));
    expect(view.getByRole('button', { name: '7 PQRS，提示按键' })).toBeTruthy();
    expect(view.getByRole('status').textContent).toContain('提示：请按 S 键');
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
    fireEvent.click(view.getByRole('button', { name: '显示这个字' }));
    expect(await view.findByText('本阶段借助了 1 次提示，继续慢慢熟悉。')).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    expect(view.getByRole('button', { name: '显示这个字' })).toBeTruthy();
    await skipStageAndContinue(view);
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
    await view.findByText('本阶段已跳过，不计作完成。');
    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    fireEvent.click(view.getByRole('button', { name: '返回上一步' }));

    fireEvent.click(view.getByRole('button', { name: '9 WXYZ' }));
    expect(view.getByText('再试一次')).toBeTruthy();
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
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    await skipStageAndContinue(view);
    await returnToPreviousStage(view, '只留少量线索，再想一遍', '凭留下的字，补全句子');

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    await skipStageAndContinue(view);
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

    expect(await view.findByRole('group', { name: '拼音首字母键盘' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    expect(await view.findByText('本阶段未使用提示，已独立完成。')).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: '继续' }));
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    fireEvent.click(view.getByRole('button', { name: '7 PQRS' }));
    expect(await view.findByText('本阶段未使用提示，已独立完成。')).toBeTruthy();
  });

  it('keeps exit and previous-stage navigation usable during practice', async () => {
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
    const previous = view.getByRole('button', { name: '返回上一步' });
    fireEvent.click(previous);
    await view.findByRole('heading', { name: '先读一遍，不急着记' });

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
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '凭留下的字，补全句子' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '只留少量线索，再想一遍' });
    await skipStageAndContinue(view);
    await view.findByRole('heading', { name: '按每个字的拼音首字母' });
    await skipStageAndContinue(view, '跳过本轮');
    await view.findByRole('heading', { name: '本轮结束' });

    fireEvent.click(view.getByRole('button', { name: '选择另一节' }));
    expect(await view.findByText('耶和华是我的牧者。')).toBeTruthy();
  });
});
