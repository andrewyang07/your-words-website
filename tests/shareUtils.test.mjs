import assert from 'node:assert/strict';
import {
  getSharedVerseSaveSummary,
  getSharedBannerCopy,
  buildShareUrl,
} from '../lib/shareUtils.mjs';

const existing = new Set(['约翰福音-3-16']);
const ids = ['约翰福音-3-16', '诗篇-23-1', '诗篇-23-1', '罗马书-8-28'];

assert.deepEqual(getSharedVerseSaveSummary(ids, existing), {
  total: 4,
  uniqueTotal: 3,
  newIds: ['诗篇-23-1', '罗马书-8-28'],
  existingCount: 1,
  newCount: 2,
});

assert.equal(
  getSharedBannerCopy({ language: 'traditional', count: 3, added: false }).title,
  '朋友分享了 3 節經文'
);
assert.equal(
  getSharedBannerCopy({ language: 'simplified', count: 1, added: true }).title,
  '已加入收藏'
);
assert.equal(
  buildShareUrl({ origin: 'https://example.com', pathname: '/search', encoded: '43-3-16' }),
  'https://example.com/?s=43-3-16'
);

console.log('shareUtils behavior ok');
