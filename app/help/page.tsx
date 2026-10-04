import type { Metadata } from 'next';
import HelpPageClient from './HelpPageClient';
import ScriptText from '@/components/ui/ScriptText';
import DocumentTitle from '@/components/layout/DocumentTitle';

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
            <DocumentTitle traditional="使用幫助" simplified="使用帮助" />
            <section className="sr-only" aria-label="使用幫助簡介">
                <h1><ScriptText traditional="使用幫助" simplified="使用帮助" /></h1>
                <p><ScriptText traditional="了解如何使用聖經背誦、搜索、Flash Card、收藏、分享與聖經筆記本功能。" simplified="了解如何使用圣经背诵、搜索、Flash Card、收藏、分享与圣经笔记本功能。" /></p>
            </section>
            <HelpPageClient />
        </>
    );
}
