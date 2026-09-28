import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '全站聖經經文排行榜',
    description: '查看你的話語全站人氣排行榜（按全站收藏次數排序，非個人「我的收藏」）。',
    alternates: {
        canonical: '/rankings',
    },
    keywords: ['聖經', '經文', '全站排行榜', '全站收藏', '人氣', '統計'],
    openGraph: {
        title: '全站聖經經文排行榜 - 你的話語',
        description: '查看你的話語全站人氣排行榜（非個人收藏）。',
        url: '/rankings',
        siteName: '你的話語',
        locale: 'zh_TW',
        type: 'website',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '全站聖經經文排行榜 - 你的話語',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '全站聖經經文排行榜 - 你的話語',
        description: '查看你的話語全站人氣排行榜（非個人收藏）。',
        images: ['/logo-light.png'],
    },
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <section className="sr-only" aria-label="全站聖經經文排行榜簡介">
                <h1>全站聖經經文排行榜</h1>
                <p>查看你的話語全站人氣經文（按全站收藏次數排序，與本機「我的收藏」無關），作為背誦、默想和查經的參考。</p>
            </section>
            {children}
        </>
    );
}
