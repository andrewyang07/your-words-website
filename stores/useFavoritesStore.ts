import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: Set<string>; // 存储经文 ID
  addFavorite: (verseId: string) => void;
  removeFavorite: (verseId: string) => void;
  toggleFavorite: (verseId: string) => void;
  isFavorite: (verseId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),

      addFavorite: (verseId) =>
        set((state) => ({
          favorites: new Set(state.favorites).add(verseId),
        })),

      removeFavorite: (verseId) => {
        const newFavorites = new Set(get().favorites);
        newFavorites.delete(verseId);
        set({ favorites: newFavorites });
      },

      toggleFavorite: (verseId) => {
        if (get().isFavorite(verseId)) {
          get().removeFavorite(verseId);
        } else {
          get().addFavorite(verseId);
        }
      },

      isFavorite: (verseId) => get().favorites.has(verseId),
    }),
    {
      name: 'favorites-storage',
      // 需要序列化 Set
      partialize: (state) => ({
        favorites: Array.from(state.favorites),
      }),
      // 反序列化
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favorites)) {
          state.favorites = new Set(state.favorites as any);
        }
      },
    }
  )
);

