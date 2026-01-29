import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

/**
 * POST /api/contributions/translations
 * 提交翻译贡献
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户会话（可选）
    const session = await auth()
    const userId = session?.user?.id

    // 解析请求体
    const body = await request.json()
    const { skillName, field, originalText, translatedText } = body

    // 验证必填字段
    if (!skillName || !field || !translatedText) {
      return NextResponse.json(
        { error: '缺少必填字段', message: 'Skill 名称、翻译字段和译文为必填项' },
        { status: 400 }
      )
    }

    // 查找对应的 Skill
    const skill = await prisma.skill.findFirst({
      where: {
        OR: [
          { name: { equals: skillName, mode: 'insensitive' } },
          { slug: { equals: skillName, mode: 'insensitive' } },
        ],
      },
    })

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill 不存在', message: `未找到名为 "${skillName}" 的 Skill` },
        { status: 404 }
      )
    }

    // 如果用户已登录，创建翻译记录
    if (userId) {
      // 检查是否已经提交过相同的翻译
      const existingTranslation = await prisma.translation.findFirst({
        where: {
          userId,
          skillId: skill.id,
          field: field,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      })

      if (existingTranslation) {
        return NextResponse.json(
          { error: '重复提交', message: '您已经提交过此翻译，请等待审核' },
          { status: 409 }
        )
      }

      // 创建翻译记录
      await prisma.translation.create({
        data: {
          skillId: skill.id,
          field,
          contentEn: originalText || '',
          contentZh: translatedText,
          userId,
          status: 'PENDING',
        },
      })

      // 奖励积分
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 20 } },
      })

      // 记录积分日志
      await prisma.creditLog.create({
        data: {
          userId,
          amount: 20,
          reason: 'TRANSLATE',
          description: `贡献翻译：${skill.name} - ${field}`,
        },
      })
    }

    // TODO: 发送通知给管理员审核
    // 这里可以集成邮件通知或 Discord webhook

    return NextResponse.json(
      {
        success: true,
        message: '翻译提交成功！感谢您的贡献，审核通过后将合并到项目中',
        data: {
          skillName: skill.name,
          field,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('提交翻译失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '提交失败，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contributions/translations
 * 获取翻译贡献列表（需要管理员权限）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 获取翻译列表
    const [translations, total] = await Promise.all([
      prisma.translation.findMany({
        where: {
          status: status as any,
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              nameZh: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.translation.count({
        where: {
          status: status as any,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        translations: translations.map((t) => ({
          id: t.id,
          skill: t.skill,
          field: t.field,
          contentEn: t.contentEn,
          contentZh: t.contentZh,
          status: t.status,
          createdAt: t.createdAt,
          user: t.user,
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
    console.error('获取翻译列表失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取翻译列表失败' },
      { status: 500 }
    )
  }
}
