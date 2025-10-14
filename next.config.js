/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // 静态导出配置（用于Vercel部署）
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
