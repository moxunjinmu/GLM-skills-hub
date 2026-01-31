import { NextRequest, NextResponse } from 'next/server'
import { search, SearchMode } from '@/lib/search/search-service'

/**
 * GET /api/search
 * 搜索 Skills，支持关键词搜索、AI 语义搜索和混合搜索
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 解析查询参数
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category') || undefined
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',') : undefined
    const sort = searchParams.get('sort') || 'relevance'
    const mode = (searchParams.get('mode') || 'hybrid') as SearchMode

    // 如果没有搜索词，返回空结果
    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          query: '',
          skills: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      })
    }

    // 执行搜索
    const { results, total } = await search(q, {
      mode,
      limit,
      offset: (page - 1) * limit,
      categoryId: category,
      tags,
    })

    // 提取 skills 列表
    const skills = results.map(r => ({
      ...r.skill,
      // 添加搜索相关信息
      _searchScore: r.score,
      _searchMatchReason: r.matchReason,
    }))

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        query: q,
        mode,
        skills,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error searching skills:', error)
    return NextResponse.json(
      {
        success: false,
        error: '搜索失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/search/suggestions
 * 获取搜索建议
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少查询参数' },
        { status: 400 }
      )
    }

    // TODO: 实现搜索建议逻辑
    const suggestions: string[] = []

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
      },
    })
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return NextResponse.json(
      { success: false, error: '获取建议失败' },
      { status: 500 }
    )
  }
}
