import { describe, expect, it } from 'vitest';
import {
  getSharedVerseSaveSummary,
  getSharedBannerCopy,
  buildShareUrl,
} from '../lib/shareUtils.mjs';

describe('shareUtils', () => {
  it('summarizes shared verse saves without duplicating existing favorites', () => {
    const existing = new Set(['约翰福音-3-16']);
    const ids = ['约翰福音-3-16', '诗篇-23-1', '诗篇-23-1', '罗马书-8-28'];

    expect(getSharedVerseSaveSummary(ids, existing)).toEqual({
      total: 4,
      uniqueTotal: 3,
      newIds: ['诗篇-23-1', '罗马书-8-28'],
      existingCount: 1,
      newCount: 2,
    });
  });

  it('builds shared verse banner copy for pending and saved states', () => {
    expect(getSharedBannerCopy({ language: 'traditional', count: 3, added: false }).title)
      .toBe('朋友分享了 3 節經文');
    expect(getSharedBannerCopy({ language: 'simplified', count: 1, added: true }).title)
      .toBe('已加入收藏');
  });

  it('normalizes shared verse URLs back to the homepage', () => {
    expect(buildShareUrl({ origin: 'https://example.com', pathname: '/search', encoded: '43-3-16' }))
      .toBe('https://example.com/?s=43-3-16');
  });
});
