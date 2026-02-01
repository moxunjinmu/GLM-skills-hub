import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

const SHARE_REWARD = 5 // 分享奖励积分
const MAX_DAILY_SHARES = 5 // 每日最多分享奖励次数

/**
 * POST /api/share
 * 记录分享并奖励积分
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
    const { skillId, platform } = body

    if (!skillId || !platform) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 和 platform 是必填项' },
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

    // 检查今日已分享次数
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayShares = await prisma.creditLog.count({
      where: {
        userId: session.user.id,
        reason: 'SHARE',
        createdAt: { gte: today },
      },
    })

    if (todayShares >= MAX_DAILY_SHARES) {
      return NextResponse.json({
        success: true,
        message: `分享成功！今日分享次数已达上限 (${MAX_DAILY_SHARES}次)`,
        data: {
          rewarded: false,
          remainingShares: 0,
        },
      })
    }

    // 记录分享并奖励积分
    await prisma.$transaction(async (tx) => {
      // 更新用户积分
      await tx.user.update({
        where: { id: session.user.id },
        data: { credits: { increment: SHARE_REWARD } },
      })

      // 记录积分日志
      await tx.creditLog.create({
        data: {
          userId: session.user.id,
          amount: SHARE_REWARD,
          reason: 'SHARE',
          description: `分享技能到 ${platform}`,
          metadata: {
            skillId,
            skillName: skill.name,
            platform,
          },
        },
      })

      // 记录使用日志（用于统计）
      await tx.usageLog.create({
        data: {
          userId: session.user.id,
          skillId,
          action: 'SHARE',
          creditsCost: 0,
          metadata: { platform },
        },
      })
    })

    // 获取更新后的用户积分
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    return NextResponse.json({
      success: true,
      message: `分享成功！获得 ${SHARE_REWARD} 积分奖励`,
      data: {
        rewarded: true,
        reward: SHARE_REWARD,
        totalCredits: user?.credits || 0,
        remainingShares: MAX_DAILY_SHARES - todayShares - 1,
      },
    })
  } catch (error) {
    console.error('分享记录失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '分享记录失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/share
 * 获取分享统计和链接
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skillId')

    if (!skillId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 是必填项' },
        { status: 400 }
      )
    }

    // 获取技能信息
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        name: true,
        nameZh: true,
        description: true,
        descriptionZh: true,
        slug: true,
        stars: true,
      },
    })

    if (!skill) {
      return NextResponse.json(
        { error: '技能不存在', message: '指定的技能不存在' },
        { status: 404 }
      )
    }

    // 生成分享链接和文本
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glm-skills-hub.vercel.app'
    const skillUrl = `${baseUrl}/skills/${skill.slug}`
    const skillName = skill.nameZh || skill.name
    const skillDesc = (skill.descriptionZh || skill.description).substring(0, 100)

    const shareData = {
      url: skillUrl,
      title: `${skillName} - AI Agent Skills`,
      description: skillDesc,
      platforms: {
        twitter: {
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`发现了超棒的 AI 技能：${skillName}\n${skillDesc}\n${skillUrl}`)}`,
          name: 'Twitter',
        },
        weibo: {
          url: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(`发现了超棒的 AI 技能：${skillName} ${skillUrl}`)}`,
          name: '微博',
        },
        wechat: {
          // 微信分享需要特殊处理（生成二维码）
          url: skillUrl,
          name: '微信',
          isQrCode: true,
        },
        linkedin: {
          url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(skillUrl)}&title=${encodeURIComponent(skillName)}`,
          name: 'LinkedIn',
        },
        copy: {
          url: skillUrl,
          name: '复制链接',
        },
      },
    }

    return NextResponse.json({
      success: true,
      data: shareData,
    })
  } catch (error) {
    console.error('获取分享信息失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取分享信息失败' },
      { status: 500 }
    )
  }
}
