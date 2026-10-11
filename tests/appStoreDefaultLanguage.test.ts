// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('app store default language', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('defaults new users to Simplified Chinese', async () => {
    const { useAppStore } = await import('../stores/useAppStore');
    expect(useAppStore.getState().language).toBe('simplified');
  });

  it('keeps an existing saved Traditional preference', async () => {
    localStorage.setItem('your-words-app', JSON.stringify({ state: { language: 'traditional', theme: 'system' }, version: 0 }));
    const { useAppStore } = await import('../stores/useAppStore');
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().language).toBe('traditional');
  });
});
