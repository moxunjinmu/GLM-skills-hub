import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * 数据库初始化 API
 * 用于在 Vercel 上初始化数据库结构
 *
 * 注意：此接口仅用于初始化，生产环境应删除或添加权限验证
 */
export async function GET() {
  // 安全检查：仅允许特定环境使用
  if (process.env.NODE_ENV === 'production') {
    const authHeader = process.env.INIT_SECRET
    // 生产环境需要提供 INIT_SECRET
    return NextResponse.json(
      { error: 'Unauthorized. Set INIT_SECRET environment variable to use this endpoint.' },
      { status: 401 }
    )
  }

  try {
    // 检查数据库连接
    await prisma.$connect()

    // 检查表是否已存在
    const categoryCount = await prisma.category.count()
    const tagCount = await prisma.tag.count()
    const skillCount = await prisma.skill.count()

    return NextResponse.json({
      status: 'connected',
      message: 'Database connected successfully',
      data: {
        categories: categoryCount,
        tags: tagCount,
        skills: skillCount,
      },
      hint: 'Run seed script to populate initial data',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure DATABASE_URL is set correctly in Vercel environment variables',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
