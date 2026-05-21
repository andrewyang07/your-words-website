import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
    title: '關於你的話語',
    description: '了解你的話語聖經背誦工具的功能特色、開發背景和使用方法。支持 Flash Card 背誦模式和聖經筆記本功能。',
    alternates: {
        canonical: '/about',
    },
    keywords: [
        '关于你的话语',
        '你的话语介绍',
        '圣经工具介绍',
        '免费圣经app',
        '圣经背诵工具',
        '圣经笔记本',
        '你的话语功能',
        '圣经学习工具',
        '灵修工具',
        '背圣经app'
    ],
    openGraph: {
        title: '關於你的話語 - 免費聖經背誦工具',
        description: '了解你的話語聖經背誦工具的功能特色和使用方法',
        url: '/about',
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
        title: '關於你的話語 - 免費聖經背誦工具',
        description: '了解你的話語聖經背誦工具的功能特色和使用方法',
        images: ['/logo-light.png'],
    },
};

export default function AboutPage() {
    return (
        <>
            <section className="sr-only" aria-label="關於你的話語簡介">
                <h1>關於你的話語</h1>
                <p>了解你的話語聖經背誦工具的功能特色、開發背景和使用方法。</p>
            </section>
            <AboutPageClient />
        </>
    );
}
