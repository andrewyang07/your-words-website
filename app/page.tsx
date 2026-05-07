import HomePageClient from '@/components/home/HomePageClient';

export default function HomePage() {
    return (
        <>
            <section className="sr-only" aria-label="你的話語簡介">
                <h1>你的話語 - 免費聖經背誦與搜索工具</h1>
                <p>
                    免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。
                </p>
            </section>
            <HomePageClient />
        </>
    );
}
