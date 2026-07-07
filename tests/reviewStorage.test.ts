import { describe, expect, it } from 'vitest';
import { cleanupReviewProgressState, deserializeReviewState, serializeReviewState } from '../stores/useReviewStore';

describe('review storage serialization', () => {
  it('round-trips review groups and progress by public state shape', () => {
    const serialized = serializeReviewState({
      reviewGroups: [
        {
          id: 'group:psalms-23',
          kind: 'passage',
          title: '诗篇 23:1-2',
          verseIds: ['psalms-23-1', 'psalms-23-2'],
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      progress: {
        'group:psalms-23': {
          itemId: 'group:psalms-23',
          stage: 'learning',
          nextReviewAt: '2026-07-06T00:00:00.000Z',
          recentRatings: ['got-it'],
        },
      },
      streak: {
        count: 3,
        lastCompletedAt: '2026-07-05T00:00:00.000Z',
      },
    });

    expect(deserializeReviewState(serialized)).toEqual({
      reviewGroups: [
        {
          id: 'group:psalms-23',
          kind: 'passage',
          title: '诗篇 23:1-2',
          verseIds: ['psalms-23-1', 'psalms-23-2'],
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      progress: {
        'group:psalms-23': {
          itemId: 'group:psalms-23',
          stage: 'learning',
          nextReviewAt: '2026-07-06T00:00:00.000Z',
          recentRatings: ['got-it'],
        },
      },
      streak: {
        count: 3,
        lastCompletedAt: '2026-07-05T00:00:00.000Z',
      },
    });
  });
});

describe('review storage cleanup', () => {
  it('preserves active progress and recent orphan progress while dropping expired orphans', () => {
    const cleaned = cleanupReviewProgressState(
      {
        reviewGroups: [],
        progress: {
          'verse:active': {
            itemId: 'verse:active',
            stage: 'reviewing',
            nextReviewAt: '2025-01-01T00:00:00.000Z',
            lastReviewedAt: '2025-01-01T00:00:00.000Z',
            recentRatings: ['got-it'],
          },
          'verse:recent-orphan': {
            itemId: 'verse:recent-orphan',
            stage: 'learning',
            nextReviewAt: '2026-02-01T00:00:00.000Z',
            lastReviewedAt: '2026-02-01T00:00:00.000Z',
            recentRatings: ['fuzzy'],
          },
          'verse:old-orphan': {
            itemId: 'verse:old-orphan',
            stage: 'learning',
            nextReviewAt: '2025-12-01T00:00:00.000Z',
            lastReviewedAt: '2025-12-01T00:00:00.000Z',
            recentRatings: ['missed'],
          },
        },
        streak: { count: 1 },
      },
      ['verse:active'],
      new Date('2026-07-05T12:00:00Z')
    );

    const serialized = serializeReviewState(cleaned);

    expect(Object.keys(deserializeReviewState(serialized).progress)).toEqual(['verse:active', 'verse:recent-orphan']);
  });

  it('keeps shared review progress when the item is later saved', () => {
    const cleaned = cleanupReviewProgressState(
      {
      reviewGroups: [],
      progress: {
        'verse:shared': {
          itemId: 'verse:shared',
          stage: 'reviewing',
          nextReviewAt: '2025-01-01T00:00:00.000Z',
          lastReviewedAt: '2025-01-01T00:00:00.000Z',
          recentRatings: ['got-it'],
        },
      },
      streak: { count: 1 },
      },
      ['verse:shared'],
      new Date('2026-07-05T12:00:00Z')
    );

    expect(cleaned.progress['verse:shared']?.recentRatings).toEqual(['got-it']);
  });
});
