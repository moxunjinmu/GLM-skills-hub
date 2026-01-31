'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  nameZh: string
  slug: string
  icon: string
  _count: {
    skills: number
  }
}

/**
 * 分类网格组件
 */
export function CategoriesGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setCategories(result.data)
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-6 rounded-lg border bg-card animate-pulse">
            <div className="h-8 w-8 mb-3 bg-muted rounded"></div>
            <div className="h-5 w-20 mb-1 bg-muted rounded"></div>
            <div className="h-4 w-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无分类数据
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="group p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <div className="text-3xl mb-3">{category.icon}</div>
          <h3 className="font-semibold mb-1">{category.nameZh}</h3>
          <p className="text-sm text-muted-foreground">
            {category._count.skills} 个 Skills
          </p>
        </Link>
      ))}
    </div>
  )
}
