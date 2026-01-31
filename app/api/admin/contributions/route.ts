import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

/**
 * 检查用户是否为管理员
 */
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  // 简单的管理员检查：基于邮箱
  // 实际应用中应该使用更安全的权限系统
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(user?.email || '')
}

/**
 * GET /api/admin/contributions
 * 获取待审核的贡献列表
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

    // 检查管理员权限
    const isUserAdmin = await isAdmin(session.user.id)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: '权限不足', message: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status !== 'ALL') {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.contribution.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        contributions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('获取贡献列表失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取贡献列表失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/contributions
 * 审核贡献（批准/拒绝）
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

    // 检查管理员权限
    const isUserAdmin = await isAdmin(session.user.id)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: '权限不足', message: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { contributionId, action, reason } = body

    if (!contributionId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: '参数错误', message: '缺少必要参数或操作类型无效' },
        { status: 400 }
      )
    }

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        user: true,
      },
    })

    if (!contribution) {
      return NextResponse.json(
        { error: '贡献不存在', message: '指定的贡献不存在' },
        { status: 404 }
      )
    }

    if (contribution.status !== 'PENDING') {
      return NextResponse.json(
        { error: '已处理', message: '该贡献已被处理过' },
        { status: 400 }
      )
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    await prisma.$transaction(async (tx) => {
      // 更新贡献状态
      await tx.contribution.update({
        where: { id: contributionId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      })

      // 根据贡献类型执行相应操作
      if (action === 'APPROVE') {
        await handleApprovedContribution(tx, contribution)
      }

      // 奖励积分（仅批准时）
      if (action === 'APPROVE') {
        const rewardAmount = getCreditReward(contribution.type)
        if (rewardAmount > 0) {
          await tx.user.update({
            where: { id: contribution.userId },
            data: { credits: { increment: rewardAmount } },
          })

          await tx.creditLog.create({
            data: {
              userId: contribution.userId,
              amount: rewardAmount,
              reason: 'SUBMIT_SKILL',
              description: `${getContributionTypeLabel(contribution.type)}被采纳`,
              metadata: {
                contributionId,
                contributionType: contribution.type,
              },
            },
          })
        }
      }
    })

    // 创建通知（将在通知系统中实现）
    // await createNotification(contribution.userId, { ... })

    return NextResponse.json({
      success: true,
      message: action === 'APPROVE' ? '已批准该贡献' : '已拒绝该贡献',
      data: {
        contributionId,
        action,
        status: newStatus,
      },
    })
  } catch (error) {
    console.error('审核贡献失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '审核贡献失败' },
      { status: 500 }
    )
  }
}

/**
 * 处理已批准的贡献
 */
async function handleApprovedContribution(tx: any, contribution: any) {
  switch (contribution.type) {
    case 'SUBMIT_SKILL':
      // 创建新技能（需要从贡献内容中解析）
      if (contribution.content) {
        const skillData = JSON.parse(contribution.content)
        // 这里需要根据实际的技能数据结构创建技能
        // await tx.skill.create({ data: skillData })
      }
      break

    case 'SUBMIT_TRANSLATION':
      // 更新翻译
      if (contribution.content) {
        const translationData = JSON.parse(contribution.content)
        await tx.translation.updateMany({
          where: {
            id: translationData.translationId,
          },
          data: {
            status: 'APPROVED',
          },
        })
      }
      break

    case 'REPORT_ISSUE':
    case 'SUGGEST_IMPROVEMENT':
      // 这些类型不需要额外操作
      break
  }
}

/**
 * 获取积分奖励
 */
function getCreditReward(type: string): number {
  const rewards: Record<string, number> = {
    SUBMIT_SKILL: 50,
    SUBMIT_TRANSLATION: 20,
    REPORT_ISSUE: 5,
    SUGGEST_IMPROVEMENT: 10,
  }
  return rewards[type] || 0
}

/**
 * 获取贡献类型标签
 */
function getContributionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SUBMIT_SKILL: '提交技能',
    SUBMIT_TRANSLATION: '提交翻译',
    REPORT_ISSUE: '报告问题',
    SUGGEST_IMPROVEMENT: '建议改进',
  }
  return labels[type] || type
}
