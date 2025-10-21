import type { Metadata } from 'next';
import HelpPageClient from './HelpPageClient';

export const metadata: Metadata = {
    title: '使用帮助 - 你的话语圣经背诵工具',
    description: '详细的使用教程和功能介绍，帮助你更好地使用圣经背诵工具和圣经笔记本功能。',
    keywords: [
        '使用帮助',
        '教程',
        '功能介绍',
        '圣经工具使用',
        '你的话语帮助',
        '圣经背诵教程',
        '圣经笔记本使用',
        'Flash Card使用',
        '经文收藏',
        '经文分享'
    ],
    openGraph: {
        title: '使用帮助 - 你的话语圣经背诵工具',
        description: '详细的使用教程和功能介绍，帮助你更好地使用圣经背诵工具',
        type: 'website',
    },
};

export default function HelpPage() {
    return <HelpPageClient />;
}
