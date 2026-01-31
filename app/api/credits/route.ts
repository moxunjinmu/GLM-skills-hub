import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

/**
 * 积分消费原因枚举（与 Prisma schema 对齐）
 */
enum CreditReason {
  REGISTER = 'REGISTER',
  DAILY_CHECKIN = 'DAILY_CHECKIN',
  SUBMIT_SKILL = 'SUBMIT_SKILL',
  TRANSLATE = 'TRANSLATE',
  INVITE = 'INVITE',
  TRIAL_USE = 'TRIAL_USE',
  AI_SEARCH = 'AI_SEARCH',
  MANUAL_ADJUST = 'MANUAL_ADJUST',
}

/**
 * GET /api/credits
 * 获取用户积分余额和使用记录
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

    // 获取用户最新的积分信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在', message: '用户信息不存在' },
        { status: 404 }
      )
    }

    // 获取积分记录
    const [logs, total] = await Promise.all([
      prisma.creditLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.creditLog.count({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        credits: user.credits,
        logs: logs.map((log) => ({
          id: log.id,
          amount: log.amount,
          reason: log.reason,
          description: log.description,
          createdAt: log.createdAt,
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
    console.error('获取积分信息失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取积分信息失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/credits/consume
 * 消费积分（用于试用技能等）
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
    const { amount, reason, description, skillId, metadata } = body

    // 验证必填字段
    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: '缺少参数', message: 'amount 是必填项' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: '缺少参数', message: 'reason 是必填项' },
        { status: 400 }
      )
    }

    // 验证 reason 是否有效
    if (!Object.values(CreditReason).includes(reason)) {
      return NextResponse.json(
        { error: '无效参数', message: `reason 必须是以下值之一: ${Object.values(CreditReason).join(', ')}` },
        { status: 400 }
      )
    }

    // 获取用户当前积分
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在', message: '用户信息不存在' },
        { status: 404 }
      )
    }

    // 检查积分是否足够
    if (user.credits < Math.abs(amount)) {
      return NextResponse.json(
        {
          error: '积分不足',
          message: `积分不足，当前积分: ${user.credits}，需要: ${Math.abs(amount)}`,
          data: { currentCredits: user.credits, required: Math.abs(amount) },
        },
        { status: 400 }
      )
    }

    // 使用事务扣除积分并记录日志
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户积分
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { credits: { increment: amount } },
        select: { credits: true },
      })

      // 创建积分日志
      await tx.creditLog.create({
        data: {
          userId: session.user.id,
          amount,
          reason,
          description,
          metadata,
        },
      })

      // 如果关联了技能，创建使用日志
      if (skillId && reason === CreditReason.TRIAL_USE) {
        await tx.usageLog.create({
          data: {
            userId: session.user.id,
            skillId,
            action: 'TRIAL',
            creditsCost: Math.abs(amount),
            metadata,
          },
        })
      }

      return updatedUser
    })

    return NextResponse.json({
      success: true,
      message: '积分消费成功',
      data: {
        remainingCredits: result.credits,
        consumed: Math.abs(amount),
      },
    })
  } catch (error) {
    console.error('积分消费失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '积分消费失败' },
      { status: 500 }
    )
  }
}
