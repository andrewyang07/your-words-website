import type { Metadata } from 'next';
import HelpPageClient from './HelpPageClient';

export const metadata: Metadata = {
    title: '幫助 - 你的話語',
    description: '「你的話語」聖經背誦助手詳細使用教程',
};

export default function HelpPage() {
    return <HelpPageClient />;
}
