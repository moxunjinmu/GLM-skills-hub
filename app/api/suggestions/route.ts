import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/suggestions
 * 获取搜索建议
 *
 * 查询参数:
 * - q: 搜索关键词
 * - limit: 返回数量限制（默认 8）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '8')

    if (!query || query.trim().length < 1) {
      // 如果没有查询词，返回热门搜索词
      const hotSearches = await getHotSearches(limit)
      return NextResponse.json({
        success: true,
        data: {
          query: '',
          type: 'hot',
          suggestions: hotSearches,
        },
      })
    }

    const trimmedQuery = query.trim()

    // 获取技能名称建议（前缀匹配）
    const nameSuggestions = await prisma.skill.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { startsWith: trimmedQuery, mode: 'insensitive' } },
          { nameZh: { startsWith: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameZh: true,
        slug: true,
        stars: true,
      },
      take: limit / 2,
      orderBy: { stars: 'desc' },
    })

    // 获取描述/内容匹配的建议
    const contentSuggestions = await prisma.skill.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { name: { startsWith: trimmedQuery, mode: 'insensitive' } },
              { nameZh: { startsWith: trimmedQuery, mode: 'insensitive' } },
            ],
          },
          { id: { notIn: nameSuggestions.map((s) => s.id) } }, // 排除已匹配的
        ],
        OR: [
          { description: { contains: trimmedQuery, mode: 'insensitive' } },
          { descriptionZh: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameZh: true,
        slug: true,
        stars: true,
      },
      take: limit / 2,
      orderBy: { stars: 'desc' },
    })

    // 合并结果并去重
    const suggestionsMap = new Map<string, any>()

    for (const skill of [...nameSuggestions, ...contentSuggestions]) {
      const key = skill.id
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          id: skill.id,
          name: skill.nameZh || skill.name,
          type: 'skill',
          slug: skill.slug,
          stars: skill.stars,
        })
      }
    }

    // 添加纯文本建议（从热门搜索词中匹配）
    const textSuggestions = getTextSuggestions(trimmedQuery, limit - suggestionsMap.size)

    const allSuggestions = [
      ...Array.from(suggestionsMap.values()),
      ...textSuggestions,
    ].slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        query: trimmedQuery,
        type: 'suggestions',
        suggestions: allSuggestions,
      },
    })
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    return NextResponse.json(
      { error: '服务器错误', message: '获取搜索建议失败' },
      { status: 500 }
    )
  }
}

/**
 * 获取热门搜索词
 */
async function getHotSearches(limit: number): Promise<Array<{ name: string; type: string; count?: number }>> {
  // 从使用日志中统计最常搜索的技能
  const popularSkills = await prisma.skill.findMany({
    where: {
      isActive: true,
      usageCount: { gte: 5 }, // 至少使用过 5 次
    },
    select: {
      name: true,
      nameZh: true,
      usageCount: true,
    },
    orderBy: { usageCount: 'desc' },
    take: limit,
  })

  return popularSkills.map((skill) => ({
    name: skill.nameZh || skill.name,
    type: 'hot',
    count: skill.usageCount,
  }))
}

/**
 * 获取文本建议（从预设的热门搜索词中匹配）
 */
function getTextSuggestions(query: string, limit: number): Array<{ name: string; type: string }> {
  const hotTerms = [
    'React', 'Next.js', '代码审查', '测试', '部署',
    '设计', '文档', '性能优化', 'AI', 'TypeScript',
    'Python', 'JavaScript', 'Node.js', 'API', '数据库'
  ]

  const matches = hotTerms.filter((term) =>
    term.toLowerCase().includes(query.toLowerCase())
  )

  return matches.slice(0, limit).map((term) => ({
    name: term,
    type: 'keyword',
  }))
}
