import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/translations
 * 提交翻译
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
    const { skillId, field, contentZh } = body

    // 验证必填字段
    if (!skillId || !field || !contentZh) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId、field 和 contentZh 是必填项' },
        { status: 400 }
      )
    }

    // 验证字段名称
    const validFields = ['name', 'description', 'skillMdContent', 'readmeContent']
    if (!validFields.includes(field)) {
      return NextResponse.json(
        { error: '无效字段', message: 'field 必须是 ' + validFields.join(', ') },
        { status: 400 }
      )
    }

    // 检查技能是否存在
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        name: true,
        nameZh: true,
        description: true,
        descriptionZh: true,
      },
    })

    if (!skill) {
      return NextResponse.json(
        { error: '技能不存在', message: '指定的技能不存在' },
        { status: 404 }
      )
    }

    // 获取原文内容
    let originalContent = ''
    switch (field) {
      case 'name':
        originalContent = skill.name
        break
      case 'description':
        originalContent = skill.description
        break
      case 'skillMdContent':
        // 需要获取完整的 skill 对象来读取 skillMdContent
        const fullSkill = await prisma.skill.findUnique({
          where: { id: skillId },
          select: { skillMdContent: true },
        })
        originalContent = fullSkill?.skillMdContent || ''
        break
      case 'readmeContent':
        const readmeSkill = await prisma.skill.findUnique({
          where: { id: skillId },
          select: { readmeContent: true },
        })
        originalContent = readmeSkill?.readmeContent || ''
        break
    }

    if (!originalContent) {
      return NextResponse.json(
        { error: '原文为空', message: '该字段的原文内容为空，无需翻译' },
        { status: 400 }
      )
    }

    // 检查是否已有翻译
    const existing = await prisma.translation.findFirst({
      where: {
        skillId,
        field,
      },
    })

    if (existing) {
      // 更新现有翻译
      await prisma.translation.update({
        where: { id: existing.id },
        data: {
          contentZh,
          userId: session.user.id,
          status: 'PENDING', // 重新提交需要审核
        },
      })

      return NextResponse.json({
        success: true,
        message: '翻译提交成功，等待审核',
        data: { translationId: existing.id },
      })
    } else {
      // 创建新翻译
      const translation = await prisma.translation.create({
        data: {
          skillId,
          field,
          contentEn: originalContent,
          contentZh,
          userId: session.user.id,
          status: 'PENDING',
        },
      })

      return NextResponse.json(
        {
          success: true,
          message: '翻译提交成功，等待审核',
          data: { translationId: translation.id },
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('提交翻译失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '提交翻译失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/translations
 * 获取技能的翻译列表
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

    const translations = await prisma.translation.findMany({
      where: { skillId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: { translations },
    })
  } catch (error) {
    console.error('获取翻译列表失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取翻译列表失败' },
      { status: 500 }
    )
  }
}
