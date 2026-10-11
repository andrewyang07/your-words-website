import type { Metadata } from 'next';

export const SITE_NAME = '你的話語';
export const DEFAULT_OG_IMAGE = { url: '/og-default.png', width: 1200, height: 630, alt: '你的话语 - 免费圣经背诵与搜索' } as const;

/**
 * A page-level `openGraph` replaces the root layout's object entirely (Next merges metadata shallowly),
 * so pages that set openGraph must repeat type/siteName/locale/url or they disappear from the HTML.
 */
export function pageOpenGraph(og: { url: string; title: string; description: string; images?: NonNullable<Metadata['openGraph']>['images'] }): Metadata['openGraph'] {
    return {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'zh_CN',
        url: og.url,
        title: og.title,
        description: og.description,
        images: og.images ?? [DEFAULT_OG_IMAGE],
    };
}

export function pageTwitter(tw: { title: string; description: string; images?: string[] }): Metadata['twitter'] {
    return { card: 'summary_large_image', title: tw.title, description: tw.description, images: tw.images ?? [DEFAULT_OG_IMAGE.url] };
}
