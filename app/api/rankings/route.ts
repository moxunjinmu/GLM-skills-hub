import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * 排名算法权重配置
 */
const RANKING_WEIGHTS = {
  githubStars: 0.25,        // GitHub Stars 权重
  usageCount: 0.30,         // 站内使用次数权重
  favoriteCount: 0.20,      // 收藏次数权重
  rating: 0.15,             // 评分权重
  recency: 0.10,            // 新近度权重
}

/**
 * 计算技能热度分数
 */
function calculateHotScore(skill: any): number {
  // 标准化 GitHub Stars (使用对数避免极端值)
  const starsScore = Math.log10((skill.stars || 0) + 1) * 10

  // 标准化使用次数
  const usageScore = Math.min((skill.usageCount || 0) / 10, 100)

  // 标准化收藏次数
  const favoriteScore = Math.min((skill._count?.favorites || 0) * 2, 100)

  // 评分分数 (1-5 分映射到 0-100)
  const ratingScore = ((skill.rating || 0) / 5) * 100

  // 新近度分数 (最近更新的技能得分更高)
  const daysSinceUpdate = skill.updatedAt
    ? Math.floor((Date.now() - new Date(skill.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 365
  const recencyScore = Math.max(0, 100 - daysSinceUpdate * 0.5)

  // 计算加权总分
  const totalScore =
    starsScore * RANKING_WEIGHTS.githubStars +
    usageScore * RANKING_WEIGHTS.usageCount +
    favoriteScore * RANKING_WEIGHTS.favoriteCount +
    ratingScore * RANKING_WEIGHTS.rating +
    recencyScore * RANKING_WEIGHTS.recency

  return Math.round(totalScore * 100) / 100
}

interface RankingParams {
  type?: 'trending' | 'stars' | 'usage' | 'newest'
  category?: string
  period?: 'day' | 'week' | 'month' | 'all'
  limit?: number
}

/**
 * GET /api/rankings
 * 获取技能榜单
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') as RankingParams['type']) || 'trending'
    const category = searchParams.get('category')
    const period = (searchParams.get('period') as RankingParams['period']) || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    // 构建基础查询条件
    const baseCondition: any = {
      isActive: true,
    }

    // 分类筛选
    if (category) {
      baseCondition.categories = {
        some: {
          slug: category,
        },
      }
    }

    // 时间范围筛选
    let dateFilter: any = {}
    const now = new Date()
    if (period === 'day') {
      dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    } else if (period === 'week') {
      dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    } else if (period === 'month') {
      dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }

    // 根据榜单类型确定排序方式
    let orderBy: any[] = []
    switch (type) {
      case 'stars':
        orderBy = [{ stars: 'desc' }, { name: 'asc' }]
        break
      case 'usage':
        orderBy = [{ usageCount: 'desc' }, { name: 'asc' }]
        break
      case 'newest':
        orderBy = [{ createdAt: 'desc' }, { name: 'asc' }]
        break
      case 'trending':
      default:
        // trending 需要综合计算，后处理
        orderBy = [{ stars: 'desc' }, { usageCount: 'desc' }]
        break
    }

    // 查询技能数据
    const skills = await prisma.skill.findMany({
      where: baseCondition,
      include: {
        categories: true,
        tags: true,
        _count: {
          select: {
            favorites: true,
            usageLogs: period !== 'all' ? {
              where: {
                createdAt: dateFilter,
              },
            } : false,
          },
        },
      },
      orderBy,
      take: limit * 2, // 多取一些用于计算趋势
    })

    // 计算热度分数并排序
    let rankedSkills = skills.map((skill) => ({
      ...skill,
      hotScore: calculateHotScore(skill),
      periodUsageCount: skill._count.usageLogs || skill.usageCount,
    }))

    // 根据榜单类型进行最终排序
    if (type === 'trending') {
      rankedSkills.sort((a, b) => b.hotScore - a.hotScore)
    } else if (type === 'usage' && period !== 'all') {
      rankedSkills.sort((a, b) => b.periodUsageCount - a.periodUsageCount)
    }

    // 限制返回数量
    rankedSkills = rankedSkills.slice(0, limit)

    // 添加排名信息
    const rankedWithPosition = rankedSkills.map((skill, index) => ({
      ...skill,
      position: index + 1,
    }))

    // 获取榜单元数据
    const metadata = await getRankingMetadata(type, period, category)

    return NextResponse.json({
      success: true,
      data: {
        type,
        period,
        category,
        rankings: rankedWithPosition,
        metadata,
      },
    })
  } catch (error) {
    console.error('获取榜单失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取榜单失败' },
      { status: 500 }
    )
  }
}

/**
 * 获取榜单元数据
 */
async function getRankingMetadata(type: string, period: string, category: string | null) {
  // 技能总数
  const totalSkills = await prisma.skill.count({
    where: {
      isActive: true,
      ...(category && {
        categories: {
          some: { slug: category },
        },
      }),
    },
  })

  // 总使用次数
  const totalUsage = await prisma.usageLog.count()

  // 总收藏数
  const totalFavorites = await prisma.favorite.count()

  // 上次更新时间
  const lastUpdate = new Date().toISOString()

  return {
    totalSkills,
    totalUsage,
    totalFavorites,
    lastUpdate,
    title: getRankingTitle(type, period),
  }
}

/**
 * 获取榜单标题
 */
function getRankingTitle(type: string, period: string): string {
  const typeTitles: Record<string, string> = {
    trending: '热门趋势榜',
    stars: 'GitHub Stars 榜',
    usage: '使用热度榜',
    newest: '最新发布榜',
  }

  const periodTitles: Record<string, string> = {
    day: '今日',
    week: '本周',
    month: '本月',
    all: '全部',
  }

  return `${periodTitles[period] || ''}${typeTitles[type] || '排行榜'}`
}
