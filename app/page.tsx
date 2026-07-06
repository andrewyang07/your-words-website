import Link from 'next/link';
import HomePageClient from '@/components/home/HomePageClient';

const primaryPages = [
    { href: '/search', label: '圣经搜索' },
    { href: '/note', label: '圣经笔记本' },
    { href: '/rankings', label: '圣经经文排行榜' },
    { href: '/about', label: '关于你的话语' },
    { href: '/help', label: '使用帮助' },
];

export default function HomePage() {
    return (
        <>
            <section className="sr-only" aria-label="你的话语简介">
                <h1>你的话语 - 免费圣经背诵与搜索工具</h1>
                <p>
                    免费圣经背诵与搜索工具，支持中文、英文、拼音快速查找经文，提供 Flash Card 背诵、经文收藏、分享与圣经笔记本功能。
                </p>
                <nav aria-label="主要页面">
                    <ul>
                        {primaryPages.map((page) => (
                            <li key={page.href}>
                                <Link href={page.href}>{page.label}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </section>
            <HomePageClient />
        </>
    );
}
