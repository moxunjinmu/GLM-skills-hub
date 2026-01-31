import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Star, GitFork, Eye, Download, ExternalLink, Github, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SkillActions } from '@/components/skill/skill-actions'
import { SkillTabs } from '@/components/skill/skill-tabs'

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic'

interface SkillPageProps {
  params?: Promise<{
    slug: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

/**
 * 获取 Skill 详情
 */
async function getSkill(slug: string) {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      categories: true,
      tags: true,
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!skill) {
    return null
  }

  // 增加浏览次数
  await prisma.skill.update({
    where: { id: skill.id },
    data: { viewCount: { increment: 1 } },
  })

  return skill
}

/**
 * 生成静态参数（用于静态生成）
 */
export async function generateStaticParams() {
  const skills = await prisma.skill.findMany({
    select: { slug: true },
    take: 50,
  })

  return skills.map((skill) => ({
    slug: skill.slug,
  }))
}

/**
 * 生成元数据
 */
export async function generateMetadata({ params }: SkillPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams?.slug ?? ''
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: {
      name: true,
      nameZh: true,
      description: true,
      descriptionZh: true,
    },
  })

  if (!skill) {
    return {
      title: 'Skill Not Found',
    }
  }

  const title = skill.nameZh || skill.name
  const description = skill.descriptionZh || skill.description

  return {
    title: `${title} - GLM Skills Hub`,
    description,
  }
}

/**
 * Skill 详情页
 */
export default async function SkillPage({ params }: SkillPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams?.slug ?? ''
  const skill = await getSkill(slug)

  if (!skill) {
    notFound()
  }

  return (
    <div className="container py-8">
      {/* 头部信息 */}
      <div className="mb-8">
        {/* 面包屑 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <a href="/skills" className="hover:text-primary">
            Skills
          </a>
          <span>/</span>
          <span className="text-foreground">{skill.nameZh || skill.name}</span>
        </div>

        {/* 标题区域 */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {skill.nameZh || skill.name}
              </h1>
              {skill.isOfficial && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                  官方
                </span>
              )}
              {skill.featured && (
                <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded">
                  精选
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-4">
              {skill.descriptionZh || skill.description}
            </p>

            {/* 作者和仓库 */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                by <a href={`https://github.com/${skill.author}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {skill.author}
                </a>
              </span>
              <a
                href={`https://github.com/${skill.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <Github className="h-4 w-4" />
                {skill.repository}
              </a>
            </div>
          </div>

          {/* 操作按钮 */}
          <SkillActions skill={skill} />
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{skill.stars.toLocaleString()}</span>
            <span className="text-muted-foreground">Stars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="h-4 w-4" />
            <span className="font-medium">{skill.forks.toLocaleString()}</span>
            <span className="text-muted-foreground">Forks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="font-medium">{skill.viewCount.toLocaleString()}</span>
            <span className="text-muted-foreground">浏览</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span className="font-medium">{skill.usageCount.toLocaleString()}</span>
            <span className="text-muted-foreground">使用</span>
          </div>
          {skill.ratingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{skill.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({skill.ratingCount} 评价)</span>
            </div>
          )}
        </div>

        {/* 分类和标签 */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {skill.categories.map((category) => (
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              {category.icon} {category.nameZh}
            </a>
          ))}
          {skill.tags.map((tag) => (
            <a
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="px-3 py-1 text-sm bg-muted rounded-full hover:bg-muted-foreground/20 transition-colors"
            >
              #{tag.nameZh}
            </a>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <SkillTabs skill={skill} />
    </div>
  )
}
