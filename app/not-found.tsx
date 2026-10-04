import type { Metadata } from 'next';
import NotFoundPageClient from '@/components/layout/NotFoundPageClient';
import DocumentTitle from '@/components/layout/DocumentTitle';

export const metadata: Metadata = {
    title: '找不到頁面',
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
};

export default function NotFound() {
    return (
        <>
            <DocumentTitle traditional="找不到頁面" simplified="找不到页面" />
            <NotFoundPageClient />
        </>
    );
}
