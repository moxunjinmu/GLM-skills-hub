/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Docker 部署需要 standalone 输出模式
  output: 'standalone',

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    // 本地图片优化
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 远程图片模式
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'opengraph.githubassets.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],

    // 静态导入禁用（使用优化后的图片）
    unoptimized: false,
  },
}

module.exports = nextConfig
