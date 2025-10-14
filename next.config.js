/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Vercel 部署使用默认的服务端渲染模式
    images: {
        remotePatterns: [],
    },
};

module.exports = nextConfig;
