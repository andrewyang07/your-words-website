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
      // - Pagefind fragments/indexes/meta have content hashes in their file names → immutable.
      {
        source: '/pagefind/:dir(fragment|index)/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/pagefind/:file(.*\\.pf_meta)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // - pagefind.js / pagefind-entry.json / wasm.*.pagefind etc. keep fixed names but point at the hashed files, so a
      //   stale copy only matters briefly: short max-age + background revalidation.
      {
        source: '/pagefind/:file(pagefind[^.]*\\.(?:js|json|css)|wasm\\..*)',
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
