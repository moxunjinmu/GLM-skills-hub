import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateEmbedding, preprocessText } from '@/lib/embeddings/zhipu-embedding'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/embeddings/generate
 * 为技能生成并存储嵌入向量
 *
 * 查询参数:
 * - skillId: 指定技能 ID（可选）
 * - force: 是否强制重新生成（默认 false）
 * - limit: 批量处理时的数量限制（默认 10）
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skillId')
    const force = searchParams.get('force') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    // 如果指定了 skillId，只处理该技能
    if (skillId) {
      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
      })

      if (!skill) {
        return NextResponse.json(
          { error: '技能不存在', message: `未找到 ID 为 ${skillId} 的技能` },
          { status: 404 }
        )
      }

      // 检查是否需要更新嵌入向量
      if (!force && skill.embedding && skill.embeddingUpdatedAt) {
        const daysSinceUpdate = (Date.now() - new Date(skill.embeddingUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate < 7) {
          return NextResponse.json({
            success: true,
            message: '嵌入向量是最新的，无需更新',
            data: {
              skillId: skill.id,
              embeddingUpdatedAt: skill.embeddingUpdatedAt,
            },
          })
        }
      }

      const embedding = await generateSkillEmbedding(skill)
      await prisma.skill.update({
        where: { id: skillId },
        data: {
          embedding,
          embeddingUpdatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: '嵌入向量生成成功',
        data: {
          skillId: skill.id,
          skillName: skill.nameZh || skill.name,
          embeddingLength: embedding.length,
        },
      })
    }

    // 批量处理：获取需要更新嵌入向量的技能
    const whereCondition: any = {
      isActive: true,
    }

    // 如果不是强制更新，只处理没有嵌入向量或过期的技能
    if (!force) {
      whereCondition.OR = [
        { embedding: Prisma.DbNull },
        { embeddingUpdatedAt: null },
        {
          embeddingUpdatedAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
          },
        },
      ]
    }

    const skills = await prisma.skill.findMany({
      where: whereCondition,
      take: limit,
      select: {
        id: true,
        name: true,
        nameZh: true,
        description: true,
        descriptionZh: true,
        skillMdContent: true,
      },
    })

    if (skills.length === 0) {
      return NextResponse.json({
        success: true,
        message: '所有技能的嵌入向量都是最新的',
        data: {
          processed: 0,
          remaining: 0,
        },
      })
    }

    // 获取总数
    const totalToUpdate = await prisma.skill.count({
      where: whereCondition,
    })

    // 批量生成嵌入向量
    const results = []
    for (const skill of skills) {
      try {
        const embedding = await generateSkillEmbedding(skill as any)
        await prisma.skill.update({
          where: { id: skill.id },
          data: {
            embedding,
            embeddingUpdatedAt: new Date(),
          },
        })
        results.push({
          skillId: skill.id,
          skillName: skill.nameZh || skill.name,
          success: true,
        })
      } catch (error) {
        console.error(`生成嵌入向量失败 [${skill.name}]:`, error)
        results.push({
          skillId: skill.id,
          skillName: skill.nameZh || skill.name,
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `批量生成完成，成功 ${successCount}，失败 ${failCount}`,
      data: {
        processed: results.length,
        remaining: totalToUpdate - results.length,
        total: totalToUpdate,
        results,
      },
    })
  } catch (error) {
    console.error('生成嵌入向量失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '生成嵌入向量失败' },
      { status: 500 }
    )
  }
}

/**
 * 为技能生成嵌入向量
 */
async function generateSkillEmbedding(skill: any): Promise<number[]> {
  // 构建技能的文本表示
  const textParts = [
    skill.name,
    skill.nameZh || '',
    skill.description,
    skill.descriptionZh || '',
  ]

  // 添加技能使用说明（如果有），但截断以避免超过 API 限制
  if (skill.skillMdContent) {
    const maxLength = 2000 // 最大 2000 字符
    const content = skill.skillMdContent.length > maxLength
      ? skill.skillMdContent.substring(0, maxLength)
      : skill.skillMdContent
    textParts.push(content)
  }

  const fullText = textParts.join('\n\n')
  const preprocessedText = preprocessText(fullText)

  return generateEmbedding(preprocessedText)
}

/**
 * GET /api/embeddings/generate
 * 获取嵌入向量生成状态
 */
export async function GET(request: NextRequest) {
  try {
    const total = await prisma.skill.count({
      where: { isActive: true },
    })

    const withEmbedding = await prisma.skill.count({
      where: {
        isActive: true,
        embedding: { not: Prisma.DbNull },
      },
    })

    const withoutEmbedding = total - withEmbedding

    const outdated = await prisma.skill.count({
      where: {
        isActive: true,
        embeddingUpdatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        total,
        withEmbedding,
        withoutEmbedding,
        outdated,
        coverage: total > 0 ? ((withEmbedding / total) * 100).toFixed(2) + '%' : '0%',
      },
    })
  } catch (error) {
    console.error('获取嵌入向量状态失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取嵌入向量状态失败' },
      { status: 500 }
    )
  }
}
