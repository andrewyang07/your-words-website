import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '聖經經文排行榜 - 你的話語',
    description: '查看最受歡迎的聖經經文排行榜，按收藏次數排序',
    keywords: ['聖經', '經文', '排行榜', '最受歡迎', '收藏', '統計'],
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

