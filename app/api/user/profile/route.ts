import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/profile
 * 获取用户个人中心数据
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权', message: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'overview'

    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        credits: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在', message: '用户不存在' },
        { status: 404 }
      )
    }

    // 根据标签页获取不同数据
    let additionalData: any = {}

    switch (tab) {
      case 'overview': {
        // 获取概览数据
        const [favoriteCount, reviewCount, usageCount, creditLogs] = await Promise.all([
          prisma.favorite.count({ where: { userId: user.id } }),
          prisma.review.count({ where: { userId: user.id } }),
          prisma.usageLog.count({ where: { userId: user.id } }),
          prisma.creditLog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
        ])

        // 今日是否已签到
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayCheckin = await prisma.creditLog.findFirst({
          where: {
            userId: user.id,
            reason: 'DAILY_CHECKIN',
            createdAt: { gte: today },
          },
        })

        additionalData = {
          stats: {
            favoriteCount,
            reviewCount,
            usageCount,
            hasCheckedInToday: !!todayCheckin,
          },
          recentCredits: creditLogs,
        }
        break
      }

      case 'favorites': {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const skip = (page - 1) * limit

        const [favorites, total] = await Promise.all([
          prisma.favorite.findMany({
            where: { userId: user.id },
            include: {
              skill: {
                include: {
                  categories: true,
                  tags: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.favorite.count({ where: { userId: user.id } }),
        ])

        additionalData = {
          favorites: favorites.map((f) => ({
            id: f.id,
            createdAt: f.createdAt,
            skill: f.skill,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        }
        break
      }

      case 'history': {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const [logs, total] = await Promise.all([
          prisma.usageLog.findMany({
            where: { userId: user.id },
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  nameZh: true,
                  slug: true,
                  repository: true,
                  stars: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.usageLog.count({ where: { userId: user.id } }),
        ])

        additionalData = {
          logs: logs.map((log) => ({
            id: log.id,
            action: log.action,
            creditsCost: log.creditsCost,
            metadata: log.metadata,
            createdAt: log.createdAt,
            skill: log.skill,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        }
        break
      }

      case 'reviews': {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        const [reviews, total] = await Promise.all([
          prisma.review.findMany({
            where: { userId: user.id },
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  nameZh: true,
                  slug: true,
                  repository: true,
                  stars: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.review.count({ where: { userId: user.id } }),
        ])

        additionalData = {
          reviews: reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            content: review.content,
            createdAt: review.createdAt,
            skill: review.skill,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        }
        break
      }

      case 'credits': {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const [logs, total] = await Promise.all([
          prisma.creditLog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.creditLog.count({ where: { userId: user.id } }),
        ])

        // 计算积分统计
        const stats = await prisma.creditLog.groupBy({
          by: ['reason'],
          where: { userId: user.id },
          _sum: { amount: true },
        })

        const creditStats: Record<string, number> = {
          earned: 0,
          spent: 0,
          checkinDays: 0,
        }

        for (const stat of stats) {
          const amount = stat._sum.amount || 0
          if (amount > 0) {
            creditStats.earned += amount
          } else {
            creditStats.spent += Math.abs(amount)
          }
          if (stat.reason === 'DAILY_CHECKIN') {
            creditStats.checkinDays += 1
          }
        }

        additionalData = {
          logs,
          stats: creditStats,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        }
        break
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        tab,
        ...additionalData,
      },
    })
  } catch (error) {
    console.error('获取用户数据失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取用户数据失败' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * 更新用户资料
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权', message: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bio } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { bio },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        credits: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: '资料更新成功',
      data: { user },
    })
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '更新用户资料失败' },
      { status: 500 }
    )
  }
}
