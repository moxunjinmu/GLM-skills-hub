'use client'

import { useEffect, useState } from 'react'

interface Stats {
  skills: number
  activeUsers: number
  totalUsage: number
  translations: number
}

/**
 * 统计数据展示组件
 */
export function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    skills: 0,
    activeUsers: 0,
    totalUsage: 0,
    translations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      label: '收录 Skills',
      value: loading ? '...' : stats.skills.toLocaleString(),
      icon: '📦',
    },
    {
      label: '活跃用户',
      value: loading ? '...' : stats.activeUsers.toLocaleString(),
      icon: '👥',
    },
    {
      label: '总使用次数',
      value: loading ? '...' : stats.totalUsage.toLocaleString(),
      icon: '⚡',
    },
    {
      label: '中文翻译',
      value: loading ? '...' : stats.translations.toLocaleString(),
      icon: '🇨🇳',
    },
  ]

  return (
    <section className="border-y bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statsData.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
