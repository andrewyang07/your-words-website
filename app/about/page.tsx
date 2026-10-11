import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';
import ScriptText from '@/components/ui/ScriptText';
import DocumentTitle from '@/components/layout/DocumentTitle';

export const metadata: Metadata = {
    title: '關於你的话语',
    description: '了解你的话语聖經背誦工具的功能特色、開發背景和使用方法。支持 Flash Card 背誦模式和聖經筆記本功能。',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        title: '關於你的话语 - 免費聖經背誦工具',
        description: '了解你的话语聖經背誦工具的功能特色和使用方法',
        url: '/about',
        siteName: '你的话语',
        locale: 'zh_TW',
        type: 'website',
        images: [
            {
                url: '/og-default.png',
                width: 1200,
                height: 630,
                alt: '你的话语 Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '關於你的话语 - 免費聖經背誦工具',
        description: '了解你的话语聖經背誦工具的功能特色和使用方法',
        images: ['/og-default.png'],
    },
};

export default function AboutPage() {
    return (
        <>
            <DocumentTitle traditional="關於你的話語" simplified="关于你的话语" />
            <section className="sr-only" aria-label="關於你的话语簡介">
                <h1><ScriptText traditional="關於你的話語" simplified="关于你的话语" /></h1>
                <p><ScriptText traditional="了解你的話語聖經背誦工具的功能特色、開發背景和使用方法。" simplified="了解你的话语圣经背诵工具的功能特色、开发背景和使用方法。" /></p>
            </section>
            <AboutPageClient />
        </>
    );
}
