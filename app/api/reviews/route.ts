import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reviews
 * 获取技能的评论列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skillId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!skillId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 是必填项' },
        { status: 400 }
      )
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { skillId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { skillId } }),
    ])

    // 计算评分统计
    const stats = await prisma.review.groupBy({
      by: ['rating'],
      where: { skillId },
      _count: { rating: true },
    })

    const ratingDistribution: Record<number, number> = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
    }

    for (const stat of stats) {
      ratingDistribution[stat.rating] = stat._count.rating
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt,
          user: {
            id: review.user.id,
            name: review.user.name,
            image: review.user.image,
          },
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          distribution: ratingDistribution,
          total,
        },
      },
    })
  } catch (error) {
    console.error('获取评论失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取评论失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews
 * 创建评论/评分
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权', message: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { skillId, rating, content } = body

    // 验证必填字段
    if (!skillId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 是必填项' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '无效评分', message: '评分必须是 1-5 之间的整数' },
        { status: 400 }
      )
    }

    // 检查技能是否存在
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    })

    if (!skill) {
      return NextResponse.json(
        { error: '技能不存在', message: '指定的技能不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已经评分过
    const existing = await prisma.review.findUnique({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '已评分', message: '您已经评分过这个技能了' },
        { status: 409 }
      )
    }

    // 创建评论
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId: session.user.id,
          skillId,
          rating,
          content: content || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })

      // 更新技能的评分统计
      const allReviews = await tx.review.findMany({
        where: { skillId },
        select: { rating: true },
      })

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const avgRating = totalRating / allReviews.length

      await tx.skill.update({
        where: { id: skillId },
        data: {
          rating: avgRating,
          ratingCount: allReviews.length,
        },
      })

      return newReview
    })

    return NextResponse.json(
      {
        success: true,
        message: '评分成功',
        data: { review },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建评论失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '创建评论失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews
 * 删除评论
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权', message: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'reviewId 是必填项' },
        { status: 400 }
      )
    }

    // 检查评论是否存在且属于当前用户
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json(
        { error: '评论不存在', message: '指定的评论不存在' },
        { status: 404 }
      )
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: '无权限', message: '您只能删除自己的评论' },
        { status: 403 }
      )
    }

    // 删除评论并更新技能评分
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      })

      // 重新计算技能评分
      const remainingReviews = await tx.review.findMany({
        where: { skillId: review.skillId },
        select: { rating: true },
      })

      if (remainingReviews.length === 0) {
        await tx.skill.update({
          where: { id: review.skillId },
          data: { rating: 0, ratingCount: 0 },
        })
      } else {
        const totalRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0)
        const avgRating = totalRating / remainingReviews.length

        await tx.skill.update({
          where: { id: review.skillId },
          data: {
            rating: avgRating,
            ratingCount: remainingReviews.length,
          },
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '删除评论失败' },
      { status: 500 }
    )
  }
}
