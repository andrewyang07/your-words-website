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

export default function AppStoreStorageSync() {
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
          theme: themes.has(nextTheme as AppState['theme']) ? nextTheme as AppState['theme'] : current.theme,
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
