export function uniquePreserveOrder<T extends string>(items: T[]): T[];
export function getSharedVerseSaveSummary(
  verseIds: string[],
  existingFavorites?: Set<string>
): {
  total: number;
  uniqueTotal: number;
  newIds: string[];
  existingCount: number;
  newCount: number;
};
export function getSharedBannerCopy(args: {
  language: 'simplified' | 'traditional';
  count: number;
  added: boolean;
  newCount?: number;
  existingCount?: number;
}): {
  title: string;
  detail: string;
  actionLabel: string;
};
export function buildShareUrl(args: { origin: string; pathname?: string; encoded: string }): string;
