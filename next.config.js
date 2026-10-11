/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel 部署使用默认的服务端渲染模式
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
  // 压缩
  compress: true,
  // 性能优化
  poweredByHeader: false,
  // 安全headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Cache policy for static search/data assets (see PR description):
      // - Everything under /pagefind gets a short TTL, NOT `immutable`. Header rules match by path, not by file
      //   existence, so on Vercel a 404 for a missing hashed file carries the same header; with a year-long
      //   immutable TTL a 404 could be pinned in browsers (e.g. after a rollback restores that hash). 1h fresh +
      //   1 day stale-while-revalidate bounds that, and the client falls back to MiniSearch when a /pagefind/
      //   load fails (lib/search/pagefindClient.ts). Hashed files still revalidate cheaply (304).
      {
        source: '/pagefind/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
      // - /data/*.json have unversioned names (Bible text rarely changes, presets change with deploys):
      //   1 day fresh, then served stale for up to a week while revalidating.
      {
        source: '/data/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
