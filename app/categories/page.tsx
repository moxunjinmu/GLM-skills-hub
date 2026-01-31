import { prisma } from '@/lib/db'
import { CategoriesList } from '@/components/categories/categories-list'

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic'

/**
 * 分类列表首页
 */
export default async function CategoriesPage() {
  // 获取所有分类及其 Skill 数量
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          skills: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
  })

  // 获取统计数据
  const totalCategories = categories.length
  const totalSkills = categories.reduce((sum, cat) => sum + cat._count.skills, 0)

  return (
    <div className="container py-12">
      {/* 页面头部 */}
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">分类浏览</h1>
        <p className="text-lg text-muted-foreground">
          探索 {totalCategories} 个分类，共 {totalSkills} 个优质 Skills
        </p>
      </div>

      {/* 分类列表 */}
      <CategoriesList categories={categories} />
    </div>
  )
}
