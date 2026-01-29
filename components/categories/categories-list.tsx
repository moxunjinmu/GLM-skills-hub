import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface CategoryWithCount {
  id: string
  name: string
  nameZh: string
  slug: string
  icon: string
  description: string
  order: number
  isActive: boolean
  _count: {
    skills: number
  }
}

interface CategoriesListProps {
  categories: CategoryWithCount[]
}

/**
 * 分类列表组件
 */
export function CategoriesList({ categories }: CategoriesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200"
        >
          {/* 图标和标题 */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">{category.icon}</div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
          </div>

          {/* 分类名称 */}
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {category.nameZh}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {category.description}
          </p>

          {/* 统计 */}
          <div className="text-sm font-medium text-primary">
            {category._count.skills} 个 Skills
          </div>
        </Link>
      ))}
    </div>
  )
}
