import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

const DAILY_CHECKIN_REWARD = 10 // 每日签到奖励积分

/**
 * POST /api/credits/checkin
 * 每日签到奖励
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

    const userId = session.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 检查今天是否已签到
    const existingLog = await prisma.creditLog.findFirst({
      where: {
        userId,
        reason: 'DAILY_CHECKIN',
        createdAt: {
          gte: today,
        },
      },
    })

    if (existingLog) {
      return NextResponse.json({
        success: false,
        message: '今天已经签到过了',
        data: {
          alreadyChecked: true,
          nextCheckIn: getNextDayMidnight(),
        },
      })
    }

    // 执行签到
    await prisma.$transaction(async (tx) => {
      // 增加积分
      await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: DAILY_CHECKIN_REWARD } },
      })

      // 记录积分日志
      await tx.creditLog.create({
        data: {
          userId,
          amount: DAILY_CHECKIN_REWARD,
          reason: 'DAILY_CHECKIN',
          description: '每日签到奖励',
        },
      })
    })

    // 获取更新后的用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    return NextResponse.json({
      success: true,
      message: `签到成功！获得 ${DAILY_CHECKIN_REWARD} 积分`,
      data: {
        reward: DAILY_CHECKIN_REWARD,
        totalCredits: user?.credits || 0,
        nextCheckIn: getNextDayMidnight(),
      },
    })
  } catch (error) {
    console.error('签到失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '签到失败' },
      { status: 500 }
    )
  }
}

/**
 * 计算明天午夜的时间戳
 */
function getNextDayMidnight(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}
