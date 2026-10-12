'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Language } from '@/types/verse';
import type { AppState } from '@/types/store';

const APP_STORE_STORAGE_KEY = 'your-words-app';
const languages = new Set<Language>(['simplified', 'traditional']);
const themes = new Set<AppState['theme']>(['light', 'dark', 'system']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function applyThemeToDocument(theme: AppState['theme']) {
  const prefersDark =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

export const TRADITIONAL_SCRIPT_CLASS = 'script-traditional';

/**
 * Server components render Simplified (SSR html lang is zh-Hans). Elements that need a script-aware aria-label
 * carry both variants as data attributes; this swaps them in on the client.
 */
export const ARIA_TRADITIONAL_ATTR = 'data-aria-label-traditional';
export const ARIA_SIMPLIFIED_ATTR = 'data-aria-label-simplified';

export function applyScriptToDocument(language: Language) {
  const root = document.documentElement;
  root.classList.toggle(TRADITIONAL_SCRIPT_CLASS, language === 'traditional');
  root.lang = language === 'traditional' ? 'zh-Hant' : 'zh-Hans';
  const attr = language === 'traditional' ? ARIA_TRADITIONAL_ATTR : ARIA_SIMPLIFIED_ATTR;
  document.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((el) => {
    const label = el.getAttribute(attr);
    if (label) el.setAttribute('aria-label', label);
  });
}

export default function AppStoreStorageSync() {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);

  // 繁體模式下讓中文字體優先使用 TC 字形（見 globals.css .script-traditional）
  useEffect(() => {
    applyScriptToDocument(language);
  }, [language]);

  // 全域套用主題，讓側欄「自動 / 淺色 / 深色」在任意頁面立即生效
  useEffect(() => {
    applyThemeToDocument(theme);
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyThemeToDocument('system');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const syncPreferences = (event: StorageEvent) => {
      if (event.key !== APP_STORE_STORAGE_KEY || !event.newValue) return;

      try {
        const persisted = JSON.parse(event.newValue) as unknown;
        if (!isRecord(persisted) || !isRecord(persisted.state)) return;

        const nextLanguage = persisted.state.language;
        const nextTheme = persisted.state.theme;
        if (!languages.has(nextLanguage as Language)) return;

        const current = useAppStore.getState();
        const preferences: Pick<AppState, 'language' | 'theme'> = {
          language: nextLanguage as Language,
          theme: themes.has(nextTheme as AppState['theme']) ? (nextTheme as AppState['theme']) : current.theme,
        };
        if (preferences.language === current.language && preferences.theme === current.theme) return;
        useAppStore.setState(preferences);
      } catch {
        // Ignore malformed or unrelated persisted values from other tabs.
      }
    };

    window.addEventListener('storage', syncPreferences);
    return () => window.removeEventListener('storage', syncPreferences);
  }, []);

  return null;
}
