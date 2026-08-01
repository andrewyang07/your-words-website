import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_READER_TEXT_SIZE,
  type ReaderTextSize,
} from '../lib/readerPreferences';

interface ReaderPreferencesState {
  textSize: ReaderTextSize;
  setTextSize: (textSize: ReaderTextSize) => void;
  resetTextSize: () => void;
}

export const useReaderPreferencesStore = create<ReaderPreferencesState>()(
  persist(
    (set) => ({
      textSize: DEFAULT_READER_TEXT_SIZE,
      setTextSize: (textSize) => set({ textSize }),
      resetTextSize: () => set({ textSize: DEFAULT_READER_TEXT_SIZE }),
    }),
    {
      name: 'your-words-reader-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ textSize }) => ({ textSize }),
    }
  )
);
