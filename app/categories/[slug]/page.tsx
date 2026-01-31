import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Suspense } from 'react'
import { CategoryHeader } from '@/components/category/category-header'
import { SkillsGrid } from '@/components/skill/skills-grid'

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params?: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    page?: string
    sort?: string
  }>
}

/**
 * 获取分类信息
 */
async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      _count: {
        select: { skills: true },
      },
    },
  })

  return category
}

/**
 * 获取分类下的 Skills
 */
async function getCategorySkills(
  categoryId: string,
  searchParams: { page?: string; sort?: string }
) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const skip = (page - 1) * limit

  // 排序方式
  let orderBy: any = { createdAt: 'desc' }
  switch (searchParams.sort) {
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

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where: {
        isActive: true,
        categories: {
          some: {
            id: categoryId,
          },
        },
      },
      include: {
        categories: true,
        tags: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.skill.count({
      where: {
        isActive: true,
        categories: {
          some: {
            id: categoryId,
          },
        },
      },
    }),
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
 * 获取所有分类（用于侧边栏）
 */
async function getAllCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}

/**
 * 生成静态参数
 */
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  })

  return categories.map((category) => ({
    slug: category.slug,
  }))
}

/**
 * 生成元数据
 */
export async function generateMetadata({ params }: CategoryPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams?.slug ?? ''
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: '分类不存在',
    }
  }

  return {
    title: `${category.nameZh} - GLM Skills Hub`,
    description: category.description || `${category.nameZh}相关的 AI Skills`,
  }
}

/**
 * 分类页面
 */
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams?.slug ?? ''
  const resolvedSearchParams = await searchParams ?? {}
  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  const [{ skills, pagination }, allCategories] = await Promise.all([
    getCategorySkills(category.id, resolvedSearchParams),
    getAllCategories(),
  ])

  return (
    <div className="container py-8">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">
          首页
        </Link>
        <span>/</span>
        <Link href="/skills" className="hover:text-primary">
          Skills
        </Link>
        <span>/</span>
        <span className="text-foreground">{category.nameZh}</span>
      </div>

      {/* 分类头部 */}
      <CategoryHeader category={category} />

      {/* Skills 网格 */}
      <Suspense fallback={<div className="text-center py-12">加载中...</div>}>
        <SkillsGrid skills={skills} pagination={pagination} />
      </Suspense>
    </div>
  )
}
