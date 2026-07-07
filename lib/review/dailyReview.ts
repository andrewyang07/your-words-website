import type { Verse } from '@/types/verse';

export type ReviewStage = 'new' | 'learning' | 'reviewing' | 'mastered';
export type ReviewRating = 'got-it' | 'fuzzy' | 'missed';
export type ReviewGroupKind = 'passage' | 'chapter';

export interface ReviewGroup {
  id: string;
  kind: ReviewGroupKind;
  title: string;
  verseIds: string[];
  createdAt: string;
}

export interface ReviewProgress {
  itemId: string;
  stage: ReviewStage;
  nextReviewAt: string;
  recentRatings: ReviewRating[];
  lastReviewedAt?: string;
}

export interface MemorizationItem {
  id: string;
  title: string;
  kind: 'verse' | ReviewGroupKind;
  verses: Verse[];
  stage: ReviewStage;
  nextReviewAt: string;
}

export interface DailyReviewQuota {
  items: MemorizationItem[];
  source: 'saved' | 'curated';
}

export interface BuildDailyReviewQuotaInput {
  savedVerseIds: string[];
  reviewGroups: ReviewGroup[];
  progress: Record<string, ReviewProgress>;
  verses: Verse[];
  today: Date;
  maxShortItems?: number;
  includeNotDue?: boolean;
}

export interface CleanupOrphanReviewProgressInput {
  progress: Record<string, ReviewProgress>;
  activeItemIds: string[];
  today: Date;
  ttlDays?: number;
}

export function buildDailyReviewQuota({
  savedVerseIds,
  reviewGroups,
  progress,
  verses,
  today,
  maxShortItems = 3,
  includeNotDue = false,
}: BuildDailyReviewQuotaInput): DailyReviewQuota {
  const verseById = new Map(verses.map((verse) => [verse.id, verse]));
  const source: DailyReviewQuota['source'] = savedVerseIds.length > 0 ? 'saved' : 'curated';
  const poolIds = source === 'saved' ? savedVerseIds : verses.map((verse) => verse.id);
  const groupedVerseIds = new Set(reviewGroups.flatMap((group) => group.verseIds));
  const items: MemorizationItem[] = [];

  for (const group of reviewGroups) {
    const groupVerses = group.verseIds.map((id) => verseById.get(id)).filter(isVerse);
    if (groupVerses.length === 0) continue;
    items.push(toGroupItem(group, groupVerses, progress[group.id], today));
  }

  for (const verseId of poolIds) {
    if (groupedVerseIds.has(verseId)) continue;
    const verse = verseById.get(verseId);
    if (!verse) continue;
    const itemId = verseItemId(verse.id);
    items.push(toVerseItem(verse, progress[itemId], today));
  }

  return {
    source,
    items: prioritizeReviewItems(items, progress, today, includeNotDue).slice(0, maxShortItems),
  };
}

export function createReviewProgress(itemId: string, createdAt: Date): ReviewProgress {
  return {
    itemId,
    stage: 'new',
    nextReviewAt: createdAt.toISOString(),
    recentRatings: [],
  };
}

export function rateReviewItem({
  progress,
  rating,
  reviewedAt,
}: {
  progress: ReviewProgress;
  rating: ReviewRating;
  reviewedAt: Date;
}): ReviewProgress {
  const stage = nextStage(progress.stage, rating);
  const nextReviewAt = addDays(reviewedAt, intervalDays(stage, rating));

  return {
    ...progress,
    stage,
    nextReviewAt: nextReviewAt.toISOString(),
    lastReviewedAt: reviewedAt.toISOString(),
    recentRatings: [rating, ...progress.recentRatings].slice(0, 10),
  };
}

export function getMasteryProgress(progress: Record<string, ReviewProgress>) {
  return Object.values(progress).reduce(
    (summary, item) => {
      summary[item.stage] += 1;
      return summary;
    },
    { new: 0, learning: 0, reviewing: 0, mastered: 0 } satisfies Record<ReviewStage, number>
  );
}

export function cleanupOrphanReviewProgress({
  progress,
  activeItemIds,
  today,
  ttlDays = 180,
}: CleanupOrphanReviewProgressInput): Record<string, ReviewProgress> {
  const active = new Set(activeItemIds);
  const ttlMs = ttlDays * 86_400_000;

  return Object.fromEntries(
    Object.entries(progress).filter(([itemId, itemProgress]) => {
      if (active.has(itemId)) return true;
      const lastTouchedAt = itemProgress.lastReviewedAt ?? itemProgress.nextReviewAt;
      return today.getTime() - new Date(lastTouchedAt).getTime() <= ttlMs;
    })
  );
}

export function verseItemId(verseId: string): string {
  return `verse:${verseId}`;
}

function toVerseItem(verse: Verse, progress: ReviewProgress | undefined, today: Date): MemorizationItem {
  const itemId = verseItemId(verse.id);
  const itemProgress = progress ?? createReviewProgress(itemId, today);
  return {
    id: itemId,
    title: `${verse.book} ${verse.chapter}:${verse.verse}`,
    kind: 'verse',
    verses: [verse],
    stage: itemProgress.stage,
    nextReviewAt: itemProgress.nextReviewAt,
  };
}

function toGroupItem(group: ReviewGroup, verses: Verse[], progress: ReviewProgress | undefined, today: Date): MemorizationItem {
  const itemProgress = progress ?? createReviewProgress(group.id, today);
  return {
    id: group.id,
    title: group.title,
    kind: group.kind,
    verses,
    stage: itemProgress.stage,
    nextReviewAt: itemProgress.nextReviewAt,
  };
}

function nextStage(stage: ReviewStage, rating: ReviewRating): ReviewStage {
  if (rating === 'missed') return stage === 'new' ? 'new' : 'learning';
  if (rating === 'fuzzy') return 'learning';
  if (stage === 'new') return 'learning';
  if (stage === 'learning') return 'reviewing';
  if (stage === 'reviewing') return 'mastered';
  return 'mastered';
}

function intervalDays(stage: ReviewStage, rating: ReviewRating): number {
  if (rating === 'missed') return 1;
  if (rating === 'fuzzy') return 2;
  if (stage === 'learning') return 1;
  if (stage === 'reviewing') return 4;
  return 30;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isDue(item: MemorizationItem, today: Date): boolean {
  return new Date(item.nextReviewAt).getTime() <= today.getTime();
}

function prioritizeReviewItems(
  items: MemorizationItem[],
  progress: Record<string, ReviewProgress>,
  today: Date,
  includeNotDue: boolean
): MemorizationItem[] {
  return [...items]
    .filter((item) => includeNotDue || isDue(item, today) || isWeak(progress[item.id]) || item.stage === 'new')
    .sort((a, b) => reviewPriority(a, progress[a.id], today) - reviewPriority(b, progress[b.id], today));
}

function reviewPriority(item: MemorizationItem, progress: ReviewProgress | undefined, today: Date): number {
  if (item.stage === 'new') return 2;
  if (isDue(item, today)) return 0;
  if (isWeak(progress)) return 1;
  if (item.stage === 'mastered') return 3;
  return 4;
}

function isWeak(progress: ReviewProgress | undefined): boolean {
  return progress?.recentRatings.some((rating) => rating === 'fuzzy' || rating === 'missed') ?? false;
}

function isVerse(verse: Verse | undefined): verse is Verse {
  return Boolean(verse);
}
