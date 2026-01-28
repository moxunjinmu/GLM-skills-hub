'use client'

import Link from 'next/link'
import { Star, GitFork, Eye } from 'lucide-react'

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
  rating: number
  ratingCount: number
  viewCount: number
  isOfficial: boolean
  featured: boolean
  categories: Array<{ nameZh: string; slug: string; icon: string }>
  tags: Array<{ nameZh: string; slug: string }>
}

interface SkillCardProps {
  skill: Skill
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link
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
            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded whitespace-nowrap">
              官方
            </span>
          )}
          {skill.featured && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded whitespace-nowrap">
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
  )
}
