import type { Metadata } from 'next';
import HelpPageClient from './HelpPageClient';

export const metadata: Metadata = {
    title: '使用幫助',
    description: '了解如何使用聖經背誦、搜索、Flash Card、收藏、分享與聖經筆記本功能。',
    alternates: {
        canonical: '/help',
    },
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
        title: '使用幫助 - 你的話語聖經背誦工具',
        description: '了解如何使用聖經背誦、搜索、Flash Card、收藏、分享與聖經筆記本功能。',
        url: '/help',
        siteName: '你的話語',
        locale: 'zh_TW',
        type: 'website',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '你的話語 Logo',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '使用幫助 - 你的話語聖經背誦工具',
        description: '了解如何使用聖經背誦、搜索、Flash Card、收藏、分享與聖經筆記本功能。',
        images: ['/logo-light.png'],
    },
};

export default function HelpPage() {
    return (
        <>
            <section className="sr-only" aria-label="使用幫助簡介">
                <h1>使用幫助</h1>
                <p>了解如何使用聖經背誦、搜索、Flash Card、收藏、分享與聖經筆記本功能。</p>
            </section>
            <HelpPageClient />
        </>
    );
}
