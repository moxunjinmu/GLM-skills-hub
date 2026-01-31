'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TrendingUp, Star, Zap, Clock, Trophy, Medal, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface RankingData {
  type: string
  period: string
  category?: string | null
  rankings: Array<{
    id: string
    position: number
    name: string
    nameZh: string | null
    description: string
    descriptionZh: string | null
    slug: string
    stars: number
    usageCount: number
    hotScore: number
    rating: number
    categories: Array<{ name: string; nameZh: string | null; slug: string }>
    tags: Array<{ name: string; nameZh: string | null }>
    repository: string
  }>
  metadata: {
    totalSkills: number
    totalUsage: number
    totalFavorites: number
    lastUpdate: string
    title: string
  }
}

interface RankingPageProps {
  initialData: RankingData | null
}

type RankingType = 'trending' | 'stars' | 'usage' | 'newest'
type RankingPeriod = 'day' | 'week' | 'month' | 'all'

const RANKING_TYPES: Array<{ value: RankingType; label: string; icon: any }> = [
  { value: 'trending', label: '热门趋势', icon: TrendingUp },
  { value: 'stars', label: 'GitHub Stars', icon: Star },
  { value: 'usage', label: '使用热度', icon: Zap },
  { value: 'newest', label: '最新发布', icon: Clock },
]

const RANKING_PERIODS: Array<{ value: RankingPeriod; label: string }> = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'all', label: '全部' },
]

export function RankingPage({ initialData }: RankingPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<RankingData | null>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState<RankingType>(
    (searchParams.get('type') as RankingType) || 'trending'
  )
  const [period, setPeriod] = useState<RankingPeriod>(
    (searchParams.get('period') as RankingPeriod) || 'all'
  )

  useEffect(() => {
    async function fetchRankings() {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/rankings?type=${type}&period=${period}`,
          { cache: 'no-store' }
        )
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [type, period])

  const handleTypeChange = (newType: RankingType) => {
    setType(newType)
    const params = new URLSearchParams({ type: newType, period })
    router.push(`/rankings?${params.toString()}`)
  }

  const handlePeriodChange = (newPeriod: RankingPeriod) => {
    setPeriod(newPeriod)
    const params = new URLSearchParams({ type, period: newPeriod })
    router.push(`/rankings?${params.toString()}`)
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Award className="h-5 w-5 text-amber-700" />
    return <span className="text-sm font-bold text-gray-500">#{position}</span>
  }

  const getRankClass = (position: number) => {
    if (position === 1) return 'bg-yellow-500/10 border-yellow-500/30'
    if (position === 2) return 'bg-gray-400/10 border-gray-400/30'
    if (position === 3) return 'bg-amber-700/10 border-amber-700/30'
    return 'bg-gray-800/30 border-gray-700'
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            技能榜单
          </h1>
          <p className="text-gray-400">
            发现最受欢迎的 AI Agent Skills
          </p>
        </div>

        {/* 榜单类型选择器 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {RANKING_TYPES.map((rankType) => {
              const Icon = rankType.icon
              return (
                <Button
                  key={rankType.value}
                  variant={type === rankType.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange(rankType.value)}
                  disabled={isLoading}
                  className={type === rankType.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {rankType.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* 时间范围选择器 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {RANKING_PERIODS.map((rankPeriod) => (
              <Button
                key={rankPeriod.value}
                variant={period === rankPeriod.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handlePeriodChange(rankPeriod.value)}
                disabled={isLoading}
                className={period === rankPeriod.value ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'text-gray-400'}
              >
                {rankPeriod.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 统计信息 */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
              <div className="text-sm text-gray-400 mb-1">技能总数</div>
              <div className="text-2xl font-bold text-white">{data.metadata.totalSkills}</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
              <div className="text-sm text-gray-400 mb-1">总使用次数</div>
              <div className="text-2xl font-bold text-white">{data.metadata.totalUsage}</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
              <div className="text-sm text-gray-400 mb-1">总收藏数</div>
              <div className="text-2xl font-bold text-white">{data.metadata.totalFavorites}</div>
            </div>
          </div>
        )}

        {/* 榜单列表 */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : data && data.rankings.length > 0 ? (
          <div className="space-y-3">
            {data.rankings.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.slug}`}
                className="block transition-transform hover:scale-[1.01]"
              >
                <div className={`rounded-lg border p-4 ${getRankClass(skill.position)}`}>
                  <div className="flex items-start gap-4">
                    {/* 排名 */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/50">
                      {getRankIcon(skill.position)}
                    </div>

                    {/* 技能信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {skill.nameZh || skill.name}
                        </h3>
                        {skill.rating > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            ⭐ {skill.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-1">
                        {skill.descriptionZh || skill.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {skill.stars} stars
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {skill.usageCount} 次使用
                        </span>
                        {type === 'trending' && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <TrendingUp className="h-3 w-3" />
                            热度 {skill.hotScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 分类标签 */}
                    <div className="flex-shrink-0 hidden sm:block">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {skill.categories.slice(0, 2).map((cat, idx) => (
                          <Badge key={`${cat.slug}-${idx}`} variant="outline" className="text-xs">
                            {cat.nameZh || cat.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">暂无数据</p>
          </div>
        )}

        {/* 更新时间 */}
        {data && (
          <div className="mt-8 text-center text-sm text-gray-500">
            最后更新: {new Date(data.metadata.lastUpdate).toLocaleString('zh-CN')}
          </div>
        )}
      </div>
    </div>
  )
}
