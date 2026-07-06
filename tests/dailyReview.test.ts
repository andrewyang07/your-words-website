import { describe, expect, it } from 'vitest';
import {
  buildDailyReviewQuota,
  cleanupOrphanReviewProgress,
  createReviewProgress,
  rateReviewItem,
  type ReviewGroup,
  type ReviewProgress,
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

  it('selects a default quota of 3 saved items by review priority', () => {
    const today = new Date('2026-07-05T12:00:00Z');
    const progress: Record<string, ReviewProgress> = {
      'verse:john-3-16': progressFor('verse:john-3-16', 'reviewing', '2026-07-04T12:00:00.000Z', []),
      'verse:romans-8-28': progressFor('verse:romans-8-28', 'learning', '2026-07-10T12:00:00.000Z', ['missed']),
      'verse:psalms-23-1': progressFor('verse:psalms-23-1', 'mastered', '2026-08-01T12:00:00.000Z', []),
    };

    const quota = buildDailyReviewQuota({
      savedVerseIds: ['psalms-23-2', 'psalms-23-1', 'romans-8-28', 'john-3-16'],
      reviewGroups: [],
      progress,
      verses,
      today,
    });

    expect(quota.items.map((item) => item.id)).toEqual(['verse:john-3-16', 'verse:romans-8-28', 'verse:psalms-23-2']);
  });

  it('can include more saved items for optional continued review', () => {
    const quota = buildDailyReviewQuota({
      savedVerseIds: ['john-3-16', 'romans-8-28', 'psalms-23-1', 'psalms-23-2'],
      reviewGroups: [],
      progress: {
        'verse:john-3-16': progressFor('verse:john-3-16', 'reviewing', '2026-07-10T12:00:00.000Z', []),
      },
      verses,
      today: new Date('2026-07-05T12:00:00Z'),
      maxShortItems: 4,
      includeNotDue: true,
    });

    expect(quota.items.map((item) => item.id)).toEqual(['verse:romans-8-28', 'verse:psalms-23-1', 'verse:psalms-23-2', 'verse:john-3-16']);
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

  it('schedules missed tomorrow and mastered got-it about 30 days later', () => {
    const reviewedAt = new Date('2026-07-05T12:00:00Z');

    expect(
      rateReviewItem({
        progress: progressFor('verse:john-3-16', 'reviewing', '2026-07-05T12:00:00.000Z', []),
        rating: 'missed',
        reviewedAt,
      })
    ).toMatchObject({
      stage: 'learning',
      nextReviewAt: '2026-07-06T12:00:00.000Z',
    });

    expect(
      rateReviewItem({
        progress: progressFor('verse:john-3-16', 'mastered', '2026-07-05T12:00:00.000Z', []),
        rating: 'got-it',
        reviewedAt,
      })
    ).toMatchObject({
      stage: 'mastered',
      nextReviewAt: '2026-08-04T12:00:00.000Z',
    });
  });

  it('keeps recent ratings bounded', () => {
    const progress = progressFor('verse:john-3-16', 'reviewing', '2026-07-05T12:00:00.000Z', Array(10).fill('fuzzy'));

    expect(
      rateReviewItem({
        progress,
        rating: 'got-it',
        reviewedAt: new Date('2026-07-05T12:00:00Z'),
      }).recentRatings
    ).toHaveLength(10);
  });
});

describe('cleanupOrphanReviewProgress', () => {
  it('preserves active saved progress and removes orphan progress older than 180 days', () => {
    const cleaned = cleanupOrphanReviewProgress({
      progress: {
        'verse:active': progressFor('verse:active', 'reviewing', '2025-01-01T00:00:00.000Z', []),
        'verse:recent-orphan': progressFor('verse:recent-orphan', 'learning', '2026-02-01T00:00:00.000Z', ['fuzzy']),
        'verse:old-orphan': progressFor('verse:old-orphan', 'learning', '2025-12-01T00:00:00.000Z', ['missed']),
      },
      activeItemIds: ['verse:active'],
      today: new Date('2026-07-05T12:00:00Z'),
    });

    expect(Object.keys(cleaned)).toEqual(['verse:active', 'verse:recent-orphan']);
  });

  it('preserves shared review progress once the item becomes active', () => {
    const cleaned = cleanupOrphanReviewProgress({
      progress: {
        'verse:shared': progressFor('verse:shared', 'reviewing', '2025-12-01T00:00:00.000Z', ['got-it']),
      },
      activeItemIds: ['verse:shared'],
      today: new Date('2026-07-05T12:00:00Z'),
    });

    expect(cleaned['verse:shared']?.recentRatings).toEqual(['got-it']);
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

function progressFor(itemId: string, stage: ReviewProgress['stage'], lastReviewedAt: string, recentRatings: ReviewProgress['recentRatings']): ReviewProgress {
  return {
    itemId,
    stage,
    nextReviewAt: lastReviewedAt,
    lastReviewedAt,
    recentRatings,
  };
}
