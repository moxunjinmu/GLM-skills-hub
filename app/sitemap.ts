import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

/**
 * 生成 Sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glm-skills-hub.vercel.app'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/skills`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contribute`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/translate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  try {
    // 获取所有活跃的技能
    const skills = await prisma.skill.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 5000, // Sitemap 限制
    })

    // 获取所有分类
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        slug: true,
      },
    })

    // 动态生成技能页面
    const skillPages: MetadataRoute.Sitemap = skills.map((skill) => ({
      url: `${baseUrl}/skills/${skill.slug}`,
      lastModified: skill.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // 动态生成分类页面
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...categoryPages, ...skillPages]
  } catch (error) {
    console.error('生成 Sitemap 失败:', error)
    return staticPages
  }
}
