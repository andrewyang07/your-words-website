import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
    title: '關於 - 你的話語',
    description: '了解「你的話語」聖經背誦助手的開發背景和使命',
};

export default function AboutPage() {
    return <AboutPageClient />;
}
