// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// React #418 on /search: a saved searchLang ('en') or an English browser used to change the first client render.
describe('search store hydration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('first render uses zh even when en is saved; the saved value applies after hydrateSearchStore()', async () => {
    localStorage.setItem('bible-search', JSON.stringify({ state: { searchLang: 'en' }, version: 0 }));
    const { useSearchStore, hydrateSearchStore } = await import('../stores/useSearchStore');
    expect(useSearchStore.getState().searchLang).toBe('zh');
    hydrateSearchStore();
    expect(useSearchStore.getState().searchLang).toBe('en');
  });

  it('with nothing saved, an English browser switches to en only after hydration', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    const { useSearchStore, hydrateSearchStore } = await import('../stores/useSearchStore');
    expect(useSearchStore.getState().searchLang).toBe('zh');
    hydrateSearchStore();
    expect(useSearchStore.getState().searchLang).toBe('en');
  });
});
