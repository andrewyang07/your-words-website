import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
    title: '关于你的话语 - 免费圣经背诵工具',
    description: '了解你的话语圣经背诵工具的功能特色、开发背景和使用方法。支持Flash Card背诵模式和圣经笔记本功能。',
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
        title: '关于你的话语 - 免费圣经背诵工具',
        description: '了解你的话语圣经背诵工具的功能特色和使用方法',
        type: 'website',
    },
};

export default function AboutPage() {
    return <AboutPageClient />;
}
