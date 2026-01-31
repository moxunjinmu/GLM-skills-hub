import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

/**
 * POST /api/contributions/skills
 * 提交 Skill 贡献
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户会话（可选）
    const session = await auth()
    const userId = session?.user?.id

    // 解析请求体
    const body = await request.json()
    const { name, repository, description, category, whyUseful } = body

    // 验证必填字段
    if (!name || !repository || !description) {
      return NextResponse.json(
        { error: '缺少必填字段', message: '名称、仓库地址和描述为必填项' },
        { status: 400 }
      )
    }

    // 验证 GitHub 仓库地址
    const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+/
    if (!githubUrlPattern.test(repository)) {
      return NextResponse.json(
        { error: '仓库地址格式不正确', message: '请输入有效的 GitHub 仓库地址' },
        { status: 400 }
      )
    }

    // 如果用户已登录，创建贡献记录
    if (userId) {
      // 检查是否已经提交过相同的 Skill
      const existingContribution = await prisma.contribution.findFirst({
        where: {
          userId,
          type: 'SUBMIT_SKILL',
          content: {
            contains: repository,
          },
        },
      })

      if (existingContribution) {
        return NextResponse.json(
          { error: '重复提交', message: '您已经提交过此 Skill，请等待审核' },
          { status: 409 }
        )
      }

      // 创建贡献记录
      await prisma.contribution.create({
        data: {
          userId,
          type: 'SUBMIT_SKILL',
          title: name,
          content: JSON.stringify({
            name,
            repository,
            description,
            category,
            whyUseful,
          }),
          status: 'PENDING',
        },
      })
    }

    // TODO: 发送通知给管理员审核
    // 这里可以集成邮件通知或 Discord webhook

    return NextResponse.json(
      {
        success: true,
        message: '提交成功！我们会在 1-2 个工作日内审核您的 Skill',
        data: {
          name,
          repository,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('提交 Skill 失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '提交失败，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contributions/skills
 * 获取贡献的 Skills 列表（需要管理员权限）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 获取贡献列表
    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: {
          type: 'SUBMIT_SKILL',
          status: status as any,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contribution.count({
        where: {
          type: 'SUBMIT_SKILL',
          status: status as any,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        contributions: contributions.map((c) => ({
          id: c.id,
          title: c.title,
          content: c.content ? JSON.parse(c.content) : null,
          status: c.status,
          createdAt: c.createdAt,
          user: c.user,
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
    console.error('获取贡献列表失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取贡献列表失败' },
      { status: 500 }
    )
  }
}
