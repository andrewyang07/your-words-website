import type { Metadata } from 'next';
import DocumentTitle from '@/components/layout/DocumentTitle';
import MemorizePageClient from '@/components/memorize/MemorizePageClient';
import { excerpt, getRecitePreview, searchParamsToString } from '@/lib/reciteLinkServer';

const staticMetadata: Metadata = {
  title: '深度背诵',
  description: '从收藏中选择一节和合本经文，逐步遮盖并按拼音首字母背诵。',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const preview = await getRecitePreview(searchParamsToString(await searchParams));
  if (!preview) return staticMetadata;
  const title = preview.title ?? (preview.count > 1 ? `${preview.firstReference}等 ${preview.count} 节` : preview.firstReference);
  const description = excerpt(preview.firstText);
  // canonicalP 只含 0-9 - ~ ,，无需编码
  const imageQuery = `p=${preview.canonicalP}${preview.title ? `&t=${encodeURIComponent(preview.title)}` : ''}`;
  const image = { url: `/api/og/memorize?${imageQuery}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

export default function MemorizePage() {
  return (
    <>
      <DocumentTitle traditional="深度背誦" simplified="深度背诵" />
      <MemorizePageClient />
    </>
  );
}
