import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState } from '@/types/store';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      currentMode: 'preset',
      loading: false,
      error: null,
      language: 'traditional', // 默认繁体中文
      theme: 'system', // 默认跟随系统

      // Actions
      setCurrentMode: (mode) => set({ currentMode: mode }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'system' : 'light',
        })),
    }),
    {
      name: 'your-words-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
      }),
    }
  )
);

