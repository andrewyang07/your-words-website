import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HomeSeoContent, { HOME_FAQ, homeFaqJsonLd } from '../components/home/HomeSeoContent';
import sitemap from '../app/sitemap';
import { metadata as homeMetadata } from '../app/page';

describe('home SEO content', () => {
  const html = renderToStaticMarkup(<HomeSeoContent />);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '');

  it('renders 300–600 Han characters with one H1, at least four H2s and the CTA', () => {
    const han = text.match(/\p{Script=Han}/gu) ?? [];
    expect(han.length).toBeGreaterThanOrEqual(300);
    expect(han.length).toBeLessThanOrEqual(600);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect((html.match(/<h2[\s>]/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(html).toMatch(/<a [^>]*href="\/memorize"[^>]*>开始背经文<\/a>/);
  });

  it('keeps FAQPage JSON-LD identical to the visible questions and answers', () => {
    const jsonLd = homeFaqJsonLd();
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd.mainEntity).toHaveLength(HOME_FAQ.length);
    for (const entry of jsonLd.mainEntity) {
      expect(html).toContain(`<h3 class="font-semibold text-stone-950 dark:text-stone-50">${entry.name}</h3>`);
      expect(text).toContain(entry.acceptedAnswer.text);
    }
    expect(html).toContain(JSON.stringify(jsonLd));
  });

  it('uses the Simplified Chinese home title/description and the large OG card', () => {
    expect(homeMetadata.title).toEqual({ absolute: '背圣经经文 · 拼音查经 · Flash Card 记忆｜你的话语（免费）' });
    expect(homeMetadata.description).toBe('免费在线背圣经：用拼音、中文或英文秒查和合本经文，Flash Card 逐节记忆，收藏、分享并写灵修笔记。');
    expect(homeMetadata.openGraph).toMatchObject({ type: 'website', siteName: '你的话语', url: '/', images: [{ url: '/og-default.png', width: 1200, height: 630 }] });
    expect(homeMetadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('lists /memorize in the sitemap', () => {
    expect(sitemap().map((entry) => entry.url)).toContain('https://www.yourwords.me/memorize');
  });
});
