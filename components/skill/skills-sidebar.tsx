'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface Category {
  id: string
  name: string
  nameZh: string
  slug: string
  icon: string
}

interface Tag {
  id: string
  name: string
  nameZh: string
  slug: string
}

interface SkillsSidebarProps {
  categories: Category[]
  tags: Tag[]
  selectedCategory?: string
  selectedTag?: string
}

export function SkillsSidebar({ categories, tags, selectedCategory, selectedTag }: SkillsSidebarProps) {
  const searchParams = useSearchParams()

  const buildUrl = (category?: string, tag?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    if (tag) {
      params.set('tag', tag)
    } else {
      params.delete('tag')
    }
    params.delete('page') // 重置页码
    return `/skills?${params.toString()}`
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('tag')
    return `/skills?${params.toString()}`
  }

  const hasActiveFilters = selectedCategory || selectedTag

  return (
    <div className="space-y-6">
      {/* 清除筛选 */}
      {hasActiveFilters && (
        <Link
          href={clearFilters()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="h-4 w-4" />
          清除筛选
        </Link>
      )}

      {/* 分类 */}
      <div>
        <h3 className="font-semibold mb-3">分类</h3>
        <ul className="space-y-1">
          <li>
            <Link
              href={buildUrl()}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span>全部</span>
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={buildUrl(category.slug)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedCategory === category.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <span>{category.icon}</span>
                <span>{category.nameZh}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 标签 */}
      <div>
        <h3 className="font-semibold mb-3">标签</h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 20).map((tag) => (
            <Link
              key={tag.id}
              href={buildUrl(undefined, tag.slug)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                selectedTag === tag.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted-foreground/20'
              )}
            >
              #{tag.nameZh}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
