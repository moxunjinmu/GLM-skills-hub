import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/stats
 * 获取站点统计数据
 */
export async function GET() {
  try {
    // 并行获取所有统计数据
    const [
      skillCount,
      userCount,
      usageCount,
      translationCount,
    ] = await Promise.all([
      // 收录的 Skills 数量
      prisma.skill.count({ where: { isActive: true } }),

      // 活跃用户数（最近30天登录过的用户）
      prisma.user.count({
        where: {
          lastSignInAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 总使用次数
      prisma.usageLog.count(),

      // 已采纳的中文翻译数量
      prisma.translation.count({
        where: { status: 'APPROVED' },
      }),
    ])

    return NextResponse.json({
      skills: skillCount,
      activeUsers: userCount,
      totalUsage: usageCount,
      translations: translationCount,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)

    // 出错时返回默认值，避免页面崩溃
    return NextResponse.json({
      skills: 0,
      activeUsers: 0,
      totalUsage: 0,
      translations: 0,
    })
  }
}
