import { Metadata } from 'next'

/**
 * 生成技能页面的 Open Graph 元数据
 */
export function generateSkillOGMetadata(skill: {
  name: string
  nameZh: string | null
  description: string
  descriptionZh: string | null
  slug: string
  repository: string
  stars?: number
  categories?: Array<{ nameZh?: string | null; icon?: string }>
}): Metadata {
  const title = `${skill.nameZh || skill.name} - AI Agent Skills`
  const description = (skill.descriptionZh || skill.description).substring(0, 160)
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glm-skills-hub.vercel.app'
  const url = `${siteUrl}/skills/${skill.slug}`
  const category = skill.categories?.[0]?.nameZh || 'AI'

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url,
      title,
      description,
      siteName: 'GLM Skills Hub',
      images: [
        {
          url: `/og-images/${skill.slug}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og-images/${skill.slug}.png`],
    },
    alternates: {
      canonical: url,
    },
    keywords: [
      skill.name,
      skill.nameZh || skill.name,
      'AI Agent',
      'Claude Skills',
      'AI 工具',
      category,
    ].filter(Boolean).join(', '),
  }
}

/**
 * 生成通用页面的 Open Graph 元数据
 */
export function generatePageOGMetadata(params: {
  title: string
  description?: string
  image?: string
  path?: string
}): Metadata {
  const { title, description, image, path = '' } = params
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glm-skills-hub.vercel.app'
  const url = `${siteUrl}${path}`

  return {
    title,
    description: description || 'GLM Skills Hub - AI Agent Skills 中文聚合平台',
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url,
      title,
      description,
      siteName: 'GLM Skills Hub',
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'GLM Skills Hub',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : ['/og-image.png'],
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * 默认网站元数据
 */
export const defaultSiteMetadata: Metadata = {
  title: {
    default: 'GLM Skills Hub - AI Agent Skills 中文聚合平台',
    template: '%s | GLM Skills Hub',
  },
  description: '发现和使用 Claude Agent Skills，中文聚合平台，提供技能搜索、分类浏览、在线试用等功能',
  keywords: ['AI Agent', 'Claude', 'Skills', 'AI 工具', '中文'],
  authors: [{ name: 'GLM Skills Hub' }],
  creator: 'GLM Skills Hub',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'GLM Skills Hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GLM Skills Hub',
    description: '发现和使用 Claude Agent Skills，中文聚合平台',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}
