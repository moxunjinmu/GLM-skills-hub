import { MetadataRoute } from 'next'

/**
 * Robots.txt 配置
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glm-skills-hub.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/try/', '/me/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
