import type { Metadata } from 'next';
import MemorizePageClient from '@/components/memorize/MemorizePageClient';

export const metadata: Metadata = {
  title: '深度背诵',
  description: '从收藏中选择一节和合本经文，逐步遮盖并按拼音首字母背诵。',
};

export default function MemorizePage() {
  return <MemorizePageClient />;
}
