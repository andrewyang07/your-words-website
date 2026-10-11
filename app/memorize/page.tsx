import type { Metadata } from 'next';
import DocumentTitle from '@/components/layout/DocumentTitle';
import MemorizePageClient from '@/components/memorize/MemorizePageClient';
import { excerpt, getRecitePreview, searchParamsToString } from '@/lib/reciteLinkServer';
import { pageOpenGraph, pageTwitter } from '@/lib/seo';

const MEMORIZE_TITLE = '圣经经文背诵';
const MEMORIZE_DESCRIPTION = '从收藏中选择一节和合本经文，分四个阶段逐步遮盖，按拼音首字母默写，真正把经文背下来。';
// 带参数的背诵链接（?p= / ?s= / ?v=）也以 /memorize 为 canonical
const CANONICAL = '/memorize';

// absolute：避免根布局模板拼上繁体的「| 你的話語」
const BRAND_SUFFIX = ' | 你的话语';

const staticMetadata: Metadata = {
  title: { absolute: `${MEMORIZE_TITLE}${BRAND_SUFFIX}` },
  description: MEMORIZE_DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: pageOpenGraph({ url: CANONICAL, title: MEMORIZE_TITLE, description: MEMORIZE_DESCRIPTION }),
  twitter: pageTwitter({ title: MEMORIZE_TITLE, description: MEMORIZE_DESCRIPTION }),
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const preview = await getRecitePreview(searchParamsToString(await searchParams));
  if (!preview) return staticMetadata;
  // 动态标题/图以背诵链接 v1 spec 为准（链接里的经文为简体 CUV，标题沿用链接作者的 t）
  const title = preview.title ?? (preview.count > 1 ? `${preview.firstReference}等 ${preview.count} 节` : preview.firstReference);
  const description = excerpt(preview.firstText);
  // canonicalP 只含 0-9 - ~ ,，无需编码
  const imageQuery = `p=${preview.canonicalP}${preview.title ? `&t=${encodeURIComponent(preview.title)}` : ''}`;
  const image = { url: `/api/og/memorize?${imageQuery}`, width: 1200, height: 630, alt: title };
  return {
    title: { absolute: `${title}${BRAND_SUFFIX}` },
    description,
    alternates: { canonical: CANONICAL },
    // og:url 指向规范化后的分享链接本身：Facebook 等会按 og:url 重新抓取，指向 /memorize 会丢掉动态预览
    openGraph: pageOpenGraph({ url: `${CANONICAL}?${imageQuery}&sv=1`, title, description, images: [image] }),
    twitter: pageTwitter({ title, description, images: [image.url] }),
  };
}

export default function MemorizePage() {
  return (
    <>
      <DocumentTitle traditional="聖經經文背誦" simplified="圣经经文背诵" />
      <h1 className="sr-only">圣经经文背诵</h1>
      <MemorizePageClient />
    </>
  );
}
