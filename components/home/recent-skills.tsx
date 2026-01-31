'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Skill {
  slug: string
  name: string
  nameZh: string | null
  description: string
  author: string
  createdAt: string
}

/**
 * 最新收录 Skills 组件
 */
export function RecentSkills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentSkills() {
      try {
        const response = await fetch('/api/skills?sort=latest&limit=5')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setSkills(result.data.skills)
          }
        }
      } catch (error) {
        console.error('获取最新 Skills 失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSkills()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
            <div className="h-5 w-32 mb-1 bg-muted rounded"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无最新收录的 Skills
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {skills.map((skill) => (
        <Link
          key={skill.slug}
          href={`/skills/${skill.slug}`}
          className="group block p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {skill.nameZh || skill.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(skill.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {skill.description}
              </p>
            </div>
            <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded">
              新收录
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
