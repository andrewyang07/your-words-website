import { describe, expect, it } from 'vitest';
import {
  buildDailyReviewQuota,
  createReviewProgress,
  rateReviewItem,
  type ReviewGroup,
} from '../lib/review/dailyReview';
import type { Verse } from '../types/verse';

const verses: Verse[] = [
  verse('john-3-16', 'john', 3, 16, '神爱世人'),
  verse('romans-8-28', 'romans', 8, 28, '万事互相效力'),
  verse('psalms-23-1', 'psalms', 23, 1, '耶和华是我的牧者'),
  verse('psalms-23-2', 'psalms', 23, 2, '他使我躺卧'),
];

describe('buildDailyReviewQuota', () => {
  it('falls back to curated verses when saved verses are empty', () => {
    const quota = buildDailyReviewQuota({
      savedVerseIds: [],
      reviewGroups: [],
      progress: {},
      verses,
      today: new Date('2026-07-05T12:00:00Z'),
    });

    expect(quota.items.map((item) => item.id)).toEqual(['verse:john-3-16', 'verse:romans-8-28', 'verse:psalms-23-1']);
    expect(quota.source).toBe('curated');
  });

  it('uses explicit review groups before standalone duplicate saved verses', () => {
    const groups: ReviewGroup[] = [
      {
        id: 'group:psalms-23',
        kind: 'passage',
        title: '诗篇 23:1-2',
        verseIds: ['psalms-23-1', 'psalms-23-2'],
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ];

    const quota = buildDailyReviewQuota({
      savedVerseIds: ['psalms-23-1', 'psalms-23-2', 'john-3-16'],
      reviewGroups: groups,
      progress: {},
      verses,
      today: new Date('2026-07-05T12:00:00Z'),
    });

    expect(quota.items.map((item) => item.id)).toEqual(['group:psalms-23', 'verse:john-3-16']);
    expect(quota.items[0].verses.map((item) => item.id)).toEqual(['psalms-23-1', 'psalms-23-2']);
    expect(quota.source).toBe('saved');
  });
});

describe('rateReviewItem', () => {
  it('moves a new item into learning and schedules the next review', () => {
    const progress = createReviewProgress('verse:john-3-16', new Date('2026-07-05T12:00:00Z'));

    expect(
      rateReviewItem({
        progress,
        rating: 'got-it',
        reviewedAt: new Date('2026-07-05T12:00:00Z'),
      })
    ).toMatchObject({
      stage: 'learning',
      nextReviewAt: '2026-07-06T12:00:00.000Z',
      recentRatings: ['got-it'],
    });
  });

  it('brings fuzzy reviewing items back sooner', () => {
    const progress = {
      ...createReviewProgress('verse:john-3-16', new Date('2026-07-01T12:00:00Z')),
      stage: 'reviewing' as const,
    };

    expect(
      rateReviewItem({
        progress,
        rating: 'fuzzy',
        reviewedAt: new Date('2026-07-05T12:00:00Z'),
      })
    ).toMatchObject({
      stage: 'learning',
      nextReviewAt: '2026-07-07T12:00:00.000Z',
      recentRatings: ['fuzzy'],
    });
  });
});

function verse(id: string, bookKey: string, chapter: number, verseNumber: number, text: string): Verse {
  return {
    id,
    book: bookKey,
    bookKey,
    chapter,
    verse: verseNumber,
    text,
    testament: 'new',
  };
}
