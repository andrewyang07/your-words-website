import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '聖經經文排行榜',
    description: '查看你的話語中較常被收藏的聖經經文排行榜，按收藏次數排序。',
    alternates: {
        canonical: '/rankings',
    },
    keywords: ['聖經', '經文', '排行榜', '最多收藏', '收藏', '統計'],
    openGraph: {
        title: '聖經經文排行榜 - 你的話語',
        description: '查看你的話語中較常被收藏的聖經經文排行榜。',
        url: '/rankings',
        siteName: '你的話語',
        locale: 'zh_TW',
        type: 'website',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '聖經經文排行榜 - 你的話語',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '聖經經文排行榜 - 你的話語',
        description: '查看你的話語中較常被收藏的聖經經文排行榜。',
        images: ['/logo-light.png'],
    },
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <section className="sr-only" aria-label="聖經經文排行榜簡介">
                <h1>聖經經文排行榜</h1>
                <p>查看你的話語中較常被收藏的聖經經文，作為背誦、默想和查經的參考。</p>
            </section>
            {children}
        </>
    );
}
