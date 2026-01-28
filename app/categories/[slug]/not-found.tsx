import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

interface CategoryPageProps {
  params: {
    slug: string
  }
}

/**
 * 分类 404 页面
 */
export default async function CategoryNotFound({ params }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug, isActive: true },
  })

  if (category) {
    notFound()
  }

  return (
    <div className="container py-20 text-center">
      <div className="text-6xl mb-4">📁</div>
      <h1 className="text-4xl font-bold mb-4">分类不存在</h1>
      <p className="text-xl text-muted-foreground mb-8">
        抱歉，找不到分类 "{params.slug}"
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/skills"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          浏览所有 Skills
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
        >
          返回首页
        </Link>
      </div>

      {/* 推荐分类 */}
      <div className="mt-12 max-w-md mx-auto">
        <h2 className="text-lg font-semibold mb-4">浏览其他分类</h2>
        <RecommendedCategories />
      </div>
    </div>
  )
}

async function RecommendedCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: { order: 'asc' },
  })

  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="text-2xl mb-2">{category.icon}</div>
          <div className="font-medium">{category.nameZh}</div>
        </Link>
      ))}
    </div>
  )
}
