import { Metadata } from 'next';
import ScriptText from '@/components/ui/ScriptText';
import DocumentTitle from '@/components/layout/DocumentTitle';

export const metadata: Metadata = {
    title: '全站聖經經文排行榜',
    description: '看看大家最常收藏、最爱背诵的圣经经文 Top 榜单。',
    alternates: {
        canonical: '/rankings',
    },
    openGraph: {
        title: '全站聖經經文排行榜 - 你的话语',
        description: '看看大家最常收藏、最爱背诵的圣经经文 Top 榜单。',
        url: '/rankings',
        siteName: '你的话语',
        locale: 'zh_CN',
        type: 'website',
        images: [
            {
                url: '/og-default.png',
                width: 1200,
                height: 630,
                alt: '全站聖經經文排行榜 - 你的话语',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '全站聖經經文排行榜 - 你的话语',
        description: '看看大家最常收藏、最爱背诵的圣经经文 Top 榜单。',
        images: ['/og-default.png'],
    },
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DocumentTitle traditional="全站聖經經文排行榜" simplified="全站圣经经文排行榜" />
            <section className="sr-only" aria-label="全站聖經經文排行榜簡介">
                <h1><ScriptText traditional="全站聖經經文排行榜" simplified="全站圣经经文排行榜" /></h1>
                <p><ScriptText traditional="查看你的話語全站人氣經文（按全站收藏次數排序，與本機「我的收藏」無關），作為背誦、默想和查經的參考。" simplified="查看你的话语全站人气经文（按全站收藏次数排序，与本机「我的收藏」无关），作为背诵、默想和查经的参考。" /></p>
            </section>
            {children}
        </>
    );
}
