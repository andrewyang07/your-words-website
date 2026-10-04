import DiscoveryPageClient from '@/components/discover/DiscoveryPageClient';
import DocumentTitle from '@/components/layout/DocumentTitle';

export default function DiscoverPage() {
  return (
    <>
      <DocumentTitle traditional="發現經文" simplified="发现经文" />
      <DiscoveryPageClient />
    </>
  );
}
