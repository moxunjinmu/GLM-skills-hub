'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, GitFork, ExternalLink } from 'lucide-react'

interface Tag {
  name: string
}

interface Skill {
  slug: string
  name: string
  nameZh: string | null
  description: string
  repository: string
  author: string
  stars: number
  forks: number
  tags: Tag[]
}

/**
 * 精选 Skills 展示组件
 */
export function FeaturedSkills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedSkills() {
      try {
        const response = await fetch('/api/skills?featured=true&limit=6')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setSkills(result.data.skills)
          }
        }
      } catch (error) {
        console.error('获取精选 Skills 失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedSkills()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 rounded-lg border bg-card animate-pulse">
            <div className="h-6 w-32 mb-2 bg-muted rounded"></div>
            <div className="h-4 w-24 mb-4 bg-muted rounded"></div>
            <div className="h-16 w-full mb-4 bg-muted rounded"></div>
            <div className="flex gap-4">
              <div className="h-4 w-12 bg-muted rounded"></div>
              <div className="h-4 w-12 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无精选 Skills
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill) => (
        <Link
          key={skill.slug}
          href={`/skills/${skill.slug}`}
          className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors"
        >
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {skill.nameZh || skill.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {skill.author}
              </p>
            </div>
            {skill.stars > 1000 && (
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                热门
              </span>
            )}
          </div>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {skill.description}
          </p>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{skill.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span>{skill.forks.toLocaleString()}</span>
            </div>
            <a
              href={`https://github.com/${skill.repository}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* 标签 */}
          {skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {skill.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.name}
                  className="px-2 py-1 text-xs bg-muted rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
