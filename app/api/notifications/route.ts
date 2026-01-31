import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications
 * 获取用户通知列表
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { userId: session.user.id }
    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // 获取未读数量
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    })
  } catch (error) {
    console.error('获取通知失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取通知失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * 标记通知为已读
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
    const { notificationId, markAll } = body

    if (markAll) {
      // 标记所有通知为已读
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      })

      return NextResponse.json({
        success: true,
        message: '已标记所有通知为已读',
      })
    }

    if (notificationId) {
      // 标记单个通知为已读
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        return NextResponse.json(
          { error: '通知不存在', message: '指定的通知不存在' },
          { status: 404 }
        )
      }

      if (notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: '权限不足', message: '您只能操作自己的通知' },
          { status: 403 }
        )
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      })

      return NextResponse.json({
        success: true,
        message: '已标记为已读',
      })
    }

    return NextResponse.json(
      { error: '参数错误', message: '需要提供 notificationId 或 markAll' },
      { status: 400 }
    )
  } catch (error) {
    console.error('标记通知失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '标记通知失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 * 删除通知
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
    const notificationId = searchParams.get('notificationId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // 删除所有已读通知
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          read: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: '已删除所有已读通知',
      })
    }

    if (notificationId) {
      // 删除单个通知
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        return NextResponse.json(
          { error: '通知不存在', message: '指定的通知不存在' },
          { status: 404 }
        )
      }

      if (notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: '权限不足', message: '您只能删除自己的通知' },
          { status: 403 }
        )
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      })

      return NextResponse.json({
        success: true,
        message: '删除成功',
      })
    }

    return NextResponse.json(
      { error: '参数错误', message: '需要提供 notificationId 或 deleteAll' },
      { status: 400 }
    )
  } catch (error) {
    console.error('删除通知失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '删除通知失败' },
      { status: 500 }
    )
  }
}

