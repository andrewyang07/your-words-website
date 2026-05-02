export function uniquePreserveOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export function getSharedVerseSaveSummary(verseIds, existingFavorites = new Set()) {
  const uniqueIds = uniquePreserveOrder(verseIds);
  const newIds = uniqueIds.filter((id) => !existingFavorites.has(id));

  return {
    total: verseIds.length,
    uniqueTotal: uniqueIds.length,
    newIds,
    existingCount: uniqueIds.length - newIds.length,
    newCount: newIds.length,
  };
}

export function getSharedBannerCopy({ language, count, added, newCount = count, existingCount = 0 }) {
  const isTraditional = language === 'traditional';
  const unit = isTraditional ? '節' : '节';

  if (added) {
    let detail;
    if (newCount > 0 && existingCount > 0) {
      detail = isTraditional
        ? `新增 ${newCount} ${unit}，另有 ${existingCount} ${unit}已在收藏中。`
        : `新增 ${newCount} ${unit}，另有 ${existingCount} ${unit}已在收藏中。`;
    } else if (newCount > 0) {
      detail = isTraditional ? `新增 ${newCount} ${unit}經文。` : `新增 ${newCount} ${unit}经文。`;
    } else {
      detail = isTraditional ? '這些經文已在你的收藏中。' : '这些经文已在你的收藏中。';
    }

    return {
      title: isTraditional ? '已加入收藏' : '已加入收藏',
      detail,
      actionLabel: isTraditional ? '關閉' : '关闭',
    };
  }

  return {
    title: isTraditional ? `朋友分享了 ${count} ${unit}經文` : `朋友分享了 ${count} ${unit}经文`,
    detail: isTraditional ? '可一鍵加入此裝置的收藏。' : '可一键加入此设备的收藏。',
    actionLabel: isTraditional ? '取消' : '取消',
  };
}

export function buildShareUrl({ origin, pathname = '/', encoded }) {
  if (!encoded) return `${origin}/`;
  return `${origin}/?s=${encoded}`;
}

export async function shareOrCopy({ title, text, url, navigatorRef = globalThis.navigator }) {
  if (navigatorRef?.share) {
    try {
      await navigatorRef.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }

  await navigatorRef?.clipboard?.writeText(url);
  return 'copied';
}
