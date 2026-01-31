import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

/**
 * GET /api/favorites
 * 获取用户的所有收藏
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: session.user.id },
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
      prisma.favorite.count({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
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
      },
    })
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取收藏列表失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/favorites
 * 添加收藏
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
    const { skillId } = body

    if (!skillId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 是必填项' },
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

    // 检查是否已收藏
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '已收藏', message: '您已经收藏过这个技能了' },
        { status: 409 }
      )
    }

    // 创建收藏
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        skillId,
      },
      include: {
        skill: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: '收藏成功',
        data: { favorite },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('添加收藏失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '添加收藏失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/favorites
 * 取消收藏
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
    const skillId = searchParams.get('skillId')

    if (!skillId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 是必填项' },
        { status: 400 }
      )
    }

    // 删除收藏
    await prisma.favorite.delete({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: '已取消收藏',
    })
  } catch (error) {
    console.error('取消收藏失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '取消收藏失败' },
      { status: 500 }
    )
  }
}
