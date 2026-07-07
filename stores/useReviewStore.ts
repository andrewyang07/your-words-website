import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  cleanupOrphanReviewProgress,
  createReviewProgress,
  getMasteryProgress,
  rateReviewItem,
  type ReviewGroup,
  type ReviewProgress,
  type ReviewRating,
  type ReviewStage,
} from '../lib/review/dailyReview';

export interface ReviewStreak {
  count: number;
  lastCompletedAt?: string;
}

export interface ReviewPersistedState {
  reviewGroups: ReviewGroup[];
  progress: Record<string, ReviewProgress>;
  streak: ReviewStreak;
}

interface ReviewStoreState extends ReviewPersistedState {
  addReviewGroup: (group: ReviewGroup) => void;
  removeReviewGroup: (groupId: string) => void;
  ensureProgress: (itemId: string, today: Date) => ReviewProgress;
  rateItem: (itemId: string, rating: ReviewRating, reviewedAt: Date) => ReviewProgress;
  completeQuota: (completedAt: Date) => void;
  cleanupOrphanProgress: (activeItemIds: string[], today: Date) => void;
  getMasteryProgress: () => Record<ReviewStage, number>;
}

const emptyState: ReviewPersistedState = {
  reviewGroups: [],
  progress: {},
  streak: { count: 0 },
};

export function serializeReviewState(state: ReviewPersistedState): ReviewPersistedState {
  return {
    reviewGroups: state.reviewGroups.map((group) => ({ ...group, verseIds: [...group.verseIds] })),
    progress: Object.fromEntries(Object.entries(state.progress).map(([key, value]) => [key, { ...value, recentRatings: [...value.recentRatings] }])),
    streak: { ...state.streak },
  };
}

export function deserializeReviewState(state: unknown): ReviewPersistedState {
  if (!state || typeof state !== 'object') return emptyState;
  const candidate = state as Partial<ReviewPersistedState>;

  return {
    reviewGroups: Array.isArray(candidate.reviewGroups) ? candidate.reviewGroups : [],
    progress: candidate.progress && typeof candidate.progress === 'object' ? candidate.progress : {},
    streak: candidate.streak && typeof candidate.streak === 'object' ? candidate.streak : { count: 0 },
  };
}

export function cleanupReviewProgressState(
  state: ReviewPersistedState,
  activeItemIds: string[],
  today: Date
): ReviewPersistedState {
  return {
    ...state,
    progress: cleanupOrphanReviewProgress({
      progress: state.progress,
      activeItemIds,
      today,
    }),
  };
}

export const useReviewStore = create<ReviewStoreState>()(
  persist<ReviewStoreState, [], [], ReviewPersistedState>(
    (set, get) => ({
      ...emptyState,

      addReviewGroup: (group: ReviewGroup) =>
        set((state) => ({
          reviewGroups: [...state.reviewGroups.filter((existing) => existing.id !== group.id), group],
        })),

      removeReviewGroup: (groupId: string) =>
        set((state) => ({
          reviewGroups: state.reviewGroups.filter((group) => group.id !== groupId),
        })),

      ensureProgress: (itemId: string, today: Date) => {
        const existing = get().progress[itemId];
        if (existing) return existing;
        const created = createReviewProgress(itemId, today);
        set((state) => ({ progress: { ...state.progress, [itemId]: created } }));
        return created;
      },

      rateItem: (itemId: string, rating: ReviewRating, reviewedAt: Date) => {
        const existing = get().ensureProgress(itemId, reviewedAt);
        const updated = rateReviewItem({ progress: existing, rating, reviewedAt });
        set((state) => ({ progress: { ...state.progress, [itemId]: updated } }));
        return updated;
      },

      completeQuota: (completedAt: Date) => {
        set((state) => ({ streak: nextStreak(state.streak, completedAt) }));
      },

      cleanupOrphanProgress: (activeItemIds: string[], today: Date) => {
        set((state) => ({
          progress: cleanupOrphanReviewProgress({
            progress: state.progress,
            activeItemIds,
            today,
          }),
        }));
      },

      getMasteryProgress: () => getMasteryProgress(get().progress),
    }),
    {
      name: 'daily-review-storage',
      partialize: serializeReviewState,
      merge: (persisted, current) => ({
        ...current,
        ...deserializeReviewState(persisted),
      }),
    }
  )
);

function nextStreak(streak: ReviewStreak, completedAt: Date): ReviewStreak {
  if (!streak.lastCompletedAt) {
    return { count: 1, lastCompletedAt: completedAt.toISOString() };
  }

  const previous = startOfDay(new Date(streak.lastCompletedAt));
  const current = startOfDay(completedAt);
  const diffDays = Math.round((current.getTime() - previous.getTime()) / 86_400_000);

  if (diffDays === 0) return streak;
  if (diffDays === 1) return { count: streak.count + 1, lastCompletedAt: completedAt.toISOString() };
  return { count: 1, lastCompletedAt: completedAt.toISOString() };
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
