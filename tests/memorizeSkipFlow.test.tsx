// @vitest-environment jsdom
import { cleanup, configure, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import MemorizePageClient from '../components/memorize/MemorizePageClient';
import { useAppStore } from '../stores/useAppStore';
import { useFavoritesStore } from '../stores/useFavoritesStore';

configure({ asyncUtilTimeout: 5000 });
vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

const STAGES = {
  simplified: {
    headings: ['先读一遍，不急着记', '凭留下的字，补全句子', '只留少量线索，再想一遍', '按每个字的拼音首字母'],
    skip: '跳过',
    skipRound: '跳过本轮',
    progress: (stage: number) => `第 ${stage} 阶段，共 4 阶段`,
    finished: '本轮结束',
  },
  traditional: {
    headings: ['先讀一遍，不急著記', '憑留下的字，補全句子', '只留少量線索，再想一遍', '按每個字的拼音首字母'],
    skip: '跳過',
    skipRound: '跳過本輪',
    progress: (stage: number) => `第 ${stage} 階段，共 4 階段`,
    finished: '本輪結束',
  },
} as const;

beforeAll(async () => {
  await import('../lib/memorize/contextualInitials');
});

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
  // Skip the first-run guide dialog so only the practice flow is under test.
  window.localStorage.setItem('your-words:memorize-guide:v3', JSON.stringify({
    version: 3, pickerSeen: true, inputSeen: true, zhuyinSeen: true, dismissed: true,
  }));
  useAppStore.persist.setOptions({
    storage: createJSONStorage(() => ({ getItem: () => null, setItem: () => undefined, removeItem: () => undefined })),
  });
  useFavoritesStore.persist.setOptions({
    storage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
  });
  useFavoritesStore.setState({ favorites: new Set() });
  window.history.replaceState({}, '', '/memorize?v=43-3-16');
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => ({ 约翰福音: { 3: { 16: url.includes('CUVT') ? '神愛世人。' : '神爱世人。' } } }),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe.each(['simplified', 'traditional'] as const)('memorize Skip button (%s)', (language) => {
  const copy = STAGES[language];

  it('advances to the next stage each time Skip is pressed, then finishes the round', async () => {
    useAppStore.setState({ language });
    const view = render(<MemorizePageClient />);
    await view.findByRole('heading', { name: copy.headings[0] });
    expect(view.getByRole('progressbar', { name: copy.progress(1) })).toBeTruthy();

    for (let stage = 1; stage < 4; stage += 1) {
      fireEvent.click(view.getByRole('button', { name: copy.skip }));
      await view.findByRole('heading', { name: copy.headings[stage] });
      expect(view.getByRole('progressbar', { name: copy.progress(stage + 1) })).toBeTruthy();
      expect(view.queryByRole('heading', { name: copy.headings[stage - 1] })).toBeNull();
    }

    // The last stage's Skip ends the round instead of advancing to a fifth stage.
    fireEvent.click(view.getByRole('button', { name: copy.skipRound }));
    await view.findByRole('heading', { name: copy.finished });
  });
});
