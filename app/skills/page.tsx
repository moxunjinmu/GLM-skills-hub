import { prisma } from '@/lib/db'
import { Suspense } from 'react'
import { SkillsHeader } from '@/components/skill/skills-header'
import { SkillsSidebar } from '@/components/skill/skills-sidebar'
import { SkillsGrid } from '@/components/skill/skills-grid'

interface SkillsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    category?: string
    tag?: string
    search?: string
  }>
}

/**
 * 获取 Skills 列表
 */
async function getSkills(params: Awaited<SkillsPageProps['searchParams']>) {
  const page = parseInt(params.page || '1')
  const limit = 12
  const skip = (page - 1) * limit

  // 构建查询条件
  const where: any = {
    isActive: true,
  }

  // 分类筛选
  if (params.category) {
    where.categories = {
      some: {
        slug: params.category,
      },
    }
  }

  // 标签筛选
  if (params.tag) {
    where.tags = {
      some: {
        slug: params.tag,
      },
    }
  }

  // 搜索筛选
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { nameZh: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { descriptionZh: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  // 排序方式
  let orderBy: any = { createdAt: 'desc' }
  switch (params.sort) {
    case 'stars':
      orderBy = { stars: 'desc' }
      break
    case 'rating':
      orderBy = [{ rating: 'desc' }, { ratingCount: 'desc' }]
      break
    case 'popular':
      orderBy = { usageCount: 'desc' }
      break
    case 'updated':
      orderBy = { updatedAt: 'desc' }
      break
  }

  // 并行查询数据和总数
  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        categories: true,
        tags: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.skill.count({ where }),
  ])

  return {
    skills,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 获取所有分类
 */
async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}

/**
 * 获取所有标签
 */
async function getTags() {
  return prisma.tag.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Skills 列表页
 */
export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const awaitedParams = await searchParams

  const [{ skills, pagination }, categories, tags] = await Promise.all([
    getSkills(awaitedParams),
    getCategories(),
    getTags(),
  ])

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 侧边栏 */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <SkillsSidebar
            categories={categories}
            tags={tags}
            selectedCategory={awaitedParams.category}
            selectedTag={awaitedParams.tag}
          />
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 min-w-0">
          {/* 头部 */}
          <SkillsHeader
            total={pagination.total}
            currentSort={awaitedParams.sort || 'latest'}
            currentSearch={awaitedParams.search}
          />

          {/* Skills 列表 */}
          <Suspense fallback={<div className="text-center py-12">加载中...</div>}>
            <SkillsGrid skills={skills} pagination={pagination} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
