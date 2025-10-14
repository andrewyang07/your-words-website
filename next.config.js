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
        ];
    },
};

module.exports = nextConfig;
