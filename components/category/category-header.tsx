'use client'

import { ArrowLeft, Grid3x3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  slug: string
  name: string
  nameZh: string
  icon: string
  description: string | null
  color: string | null
  _count: {
    skills: number
  }
}

interface CategoryHeaderProps {
  category: Category
}

export function CategoryHeader({ category }: CategoryHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortOptions = [
    { value: 'latest', label: '最新' },
    { value: 'stars', label: 'Stars' },
    { value: 'rating', label: '评分' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'updated', label: '最近更新' },
  ]

  const currentSort = searchParams.get('sort') || 'latest'

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    params.delete('page')
    router.push(`/categories/${category.slug}?${params.toString()}`)
  }

  return (
    <div className="mb-8">
      {/* 返回按钮 */}
      <Link
        href="/skills"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回 Skills 列表
      </Link>

      {/* 分类信息 */}
      <div className="flex items-start gap-6 mb-6">
        {/* 图标 */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{
            backgroundColor: category.color
              ? `${category.color}20`
              : 'hsl(var(--muted))',
          }}
        >
          {category.icon}
        </div>

        {/* 信息 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{category.nameZh}</h1>
            <span className="px-3 py-1 text-sm bg-muted rounded-full">
              {category._count.skills} 个 Skills
            </span>
          </div>
          <p className="text-muted-foreground">
            {category.description || `${category.nameZh}相关的 AI Skills`}
          </p>
        </div>
      </div>

      {/* 排序选项 */}
      <div className="flex items-center gap-4 border-t pt-6">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">排序:</span>
          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  currentSort === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted-foreground/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
