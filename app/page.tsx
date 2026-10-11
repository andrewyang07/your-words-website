import type { Metadata } from 'next';
import DocumentTitle from '@/components/layout/DocumentTitle';
import HomePageClient from '@/components/home/HomePageClient';
import HomeSeoContent from '@/components/home/HomeSeoContent';
import { pageOpenGraph, pageTwitter } from '@/lib/seo';

const HOME_TITLE = '背圣经经文 · 拼音查经 · Flash Card 记忆｜你的话语（免费）';
const HOME_DESCRIPTION = '免费在线背圣经：用拼音、中文或英文秒查和合本经文，Flash Card 逐节记忆，收藏、分享并写灵修笔记。';

export const metadata: Metadata = {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    alternates: { canonical: '/' },
    openGraph: pageOpenGraph({ url: '/', title: HOME_TITLE, description: HOME_DESCRIPTION }),
    twitter: pageTwitter({ title: HOME_TITLE, description: HOME_DESCRIPTION }),
};

export default function HomePage() {
    return (
        <>
            <DocumentTitle
                absolute
                traditional="背聖經經文 · 拼音查經 · Flash Card 記憶｜你的話語（免費）"
                simplified={HOME_TITLE}
            />
            <HomePageClient />
            <HomeSeoContent />
        </>
    );
}
