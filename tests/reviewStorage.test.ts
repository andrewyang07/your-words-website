import { describe, expect, it } from 'vitest';
import { deserializeReviewState, serializeReviewState } from '../stores/useReviewStore';

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
