import Link from 'next/link';
import HomePageClient from '@/components/home/HomePageClient';

const primaryPages = [
    { href: '/search', label: '聖經搜索' },
    { href: '/note', label: '聖經筆記本' },
    { href: '/rankings', label: '聖經經文排行榜' },
    { href: '/about', label: '關於你的話語' },
    { href: '/help', label: '使用幫助' },
];

export default function HomePage() {
    return (
        <>
            <section className="sr-only" aria-label="你的話語簡介">
                <h1>你的話語 - 免費聖經背誦與搜索工具</h1>
                <p>
                    免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。
                </p>
                <nav aria-label="主要頁面">
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
