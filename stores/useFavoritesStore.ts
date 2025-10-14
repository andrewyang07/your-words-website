import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: Set<string>; // 存储经文 ID
  addFavorite: (verseId: string) => void;
  removeFavorite: (verseId: string) => void;
  toggleFavorite: (verseId: string) => void;
  isFavorite: (verseId: string) => boolean;
  addFavorites: (verseIds: string[]) => void; // 批量添加收藏
  getFavoritesList: () => string[]; // 获取收藏列表数组
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

      addFavorites: (verseIds) => {
        const newFavorites = new Set(get().favorites);
        verseIds.forEach((id) => newFavorites.add(id));
        set({ favorites: newFavorites });
      },

      getFavoritesList: () => Array.from(get().favorites),
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

