'use client'

import Link from 'next/link'
import { Star, GitFork, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Skill {
  id: string
  name: string
  nameZh: string | null
  slug: string
  description: string
  descriptionZh: string | null
  repository: string
  author: string
  stars: number
  forks: number
  viewCount: number
  usageCount: number
  rating: number
  ratingCount: number
  isOfficial: boolean
  featured: boolean
  categories: Array<{ nameZh: string; slug: string; icon: string }>
  tags: Array<{ nameZh: string; slug: string }>
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface SkillsGridProps {
  skills: Skill[]
  pagination: Pagination
}

export function SkillsGrid({ skills, pagination }: SkillsGridProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无 Skills</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Skills 网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <Link
            key={skill.id}
            href={`/skills/${skill.slug}`}
            className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-all"
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                {skill.nameZh || skill.name}
              </h3>
              <div className="flex gap-1">
                {skill.isOfficial && (
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                    官方
                  </span>
                )}
                {skill.featured && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded">
                    精选
                  </span>
                )}
              </div>
            </div>

            {/* 描述 */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {skill.descriptionZh || skill.description}
            </p>

            {/* 分类 */}
            {skill.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {skill.categories.slice(0, 2).map((category) => (
                  <span
                    key={category.slug}
                    className="px-2 py-0.5 text-xs bg-muted rounded"
                  >
                    {category.icon} {category.nameZh}
                  </span>
                ))}
              </div>
            )}

            {/* 统计信息 */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                <span>{skill.stars.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5" />
                <span>{skill.forks.toLocaleString()}</span>
              </div>
              {skill.viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{skill.viewCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && <Pagination pagination={pagination} />}
    </div>
  )
}

function Pagination({ pagination }: { pagination: Pagination }) {
  const pages = []
  const { page, totalPages } = pagination

  // 显示页码范围
  let startPage = Math.max(1, page - 2)
  let endPage = Math.min(totalPages, page + 2)

  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + 4)
    } else if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4)
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* 上一页 */}
      {page > 1 && (
        <Link
          href={`/skills?page=${page - 1}`}
          className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
        >
          上一页
        </Link>
      )}

      {/* 页码 */}
      {startPage > 1 && (
        <>
          <Link
            href={`/skills?page=1`}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
          >
            1
          </Link>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={`/skills?page=${p}`}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            p === page
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted'
          }`}
        >
          {p}
        </Link>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Link
            href={`/skills?page=${totalPages}`}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* 下一页 */}
      {page < totalPages && (
        <Link
          href={`/skills?page=${page + 1}`}
          className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
        >
          下一页
        </Link>
      )}
    </div>
  )
}
