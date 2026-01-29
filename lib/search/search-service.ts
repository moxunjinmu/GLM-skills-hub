/**
 * 搜索服务模块
 * 支持关键词搜索、AI 语义搜索和混合搜索
 */

import { prisma } from '@/lib/db'
import { generateEmbedding, cosineSimilarity, preprocessText } from '@/lib/embeddings/zhipu-embedding'

// 搜索模式枚举
export enum SearchMode {
  KEYWORD = 'keyword',      // 关键词搜索
  SEMANTIC = 'semantic',    // AI 语义搜索
  HYBRID = 'hybrid',        // 混合搜索（推荐）
}

// 搜索结果接口
export interface SearchResult {
  skill: any
  score: number              // 相关性得分
  matchReason?: string       // 匹配原因
}

// 搜索选项接口
export interface SearchOptions {
  mode: SearchMode
  limit?: number
  offset?: number
  categoryId?: string
  tags?: string[]
  minStars?: number
}

/**
 * 关键词搜索
 * 使用 SQL LIKE 进行模糊匹配
 */
async function searchByKeyword(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const { limit = 12, offset = 0, categoryId, tags, minStars } = options

  // 构建搜索条件
  const where: any = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { nameZh: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { descriptionZh: { contains: query, mode: 'insensitive' } },
      { skillMdContent: { contains: query, mode: 'insensitive' } },
    ],
  }

  // 分类筛选
  if (categoryId) {
    where.categories = {
      some: { slug: categoryId }
    }
  }

  // 标签筛选
  if (tags && tags.length > 0) {
    where.tags = {
      some: { slug: { in: tags } }
    }
  }

  // 最低星级筛选
  if (minStars) {
    where.stars = { gte: minStars }
  }

  const skills = await prisma.skill.findMany({
    where,
    include: {
      categories: true,
      tags: true,
    },
    orderBy: [
      { stars: 'desc' },
      { rating: 'desc' },
    ],
    skip: offset,
    take: limit,
  })

  // 计算相关性得分
  return skills.map(skill => {
    let score = 0
    const reasons: string[] = []

    // 名称匹配得分最高
    if (skill.name.toLowerCase().includes(query.toLowerCase())) {
      score += 100
      reasons.push('名称匹配')
    }
    if (skill.nameZh?.toLowerCase().includes(query.toLowerCase())) {
      score += 90
      reasons.push('中文名称匹配')
    }

    // 描述匹配
    if (skill.description.toLowerCase().includes(query.toLowerCase())) {
      score += 50
      reasons.push('描述匹配')
    }
    if (skill.descriptionZh?.toLowerCase().includes(query.toLowerCase())) {
      score += 45
      reasons.push('中文描述匹配')
    }

    // 内容匹配
    if (skill.skillMdContent?.toLowerCase().includes(query.toLowerCase())) {
      score += 30
      reasons.push('内容匹配')
    }

    // 热度加成
    score += Math.min(skill.stars / 10, 20)
    score += Math.min(skill.rating * 5, 15)

    return {
      skill,
      score,
      matchReason: reasons.join('、'),
    }
  }).sort((a, b) => b.score - a.score)
}

/**
 * AI 语义搜索
 * 使用智谱 AI 文本嵌入和余弦相似度
 */
async function searchBySemantic(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const { limit = 12, offset = 0, categoryId, tags, minStars } = options

  // 预处理查询文本
  const preprocessedQuery = preprocessText(query)

  // 使用智谱 AI 生成查询向量
  const queryEmbedding = await generateEmbedding(preprocessedQuery)

  // 获取候选 Skills
  const where: any = { isActive: true }

  if (categoryId) {
    where.categories = { some: { slug: categoryId } }
  }
  if (tags && tags.length > 0) {
    where.tags = { some: { slug: { in: tags } } }
  }
  if (minStars) {
    where.stars = { gte: minStars }
  }

  const skills = await prisma.skill.findMany({
    where,
    include: {
      categories: true,
      tags: true,
    },
    take: 100, // 获取更多候选结果用于语义匹配
  })

  // 计算语义相似度
  const results: SearchResult[] = []

  for (const skill of skills) {
    // 构建 Skill 的文本表示
    const skillText = preprocessText(
      `${skill.name} ${skill.nameZh || ''} ${skill.description} ${skill.descriptionZh || ''}`
    )

    // 生成 Skill 的嵌入向量（TODO: 实际应用中应该预存到数据库）
    const skillEmbedding = await generateEmbedding(skillText)

    // 计算余弦相似度
    const similarity = cosineSimilarity(queryEmbedding, skillEmbedding)

    if (similarity > 0.3) { // 相似度阈值
      results.push({
        skill,
        score: similarity * 100,
        matchReason: 'AI 语义匹配',
      })
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(offset, offset + limit)
}

/**
 * 混合搜索（推荐）
 * 结合关键词和语义搜索的结果
 */
async function searchByHybrid(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const { limit = 12 } = options

  // 并行执行关键词搜索和语义搜索
  const [keywordResults, semanticResults] = await Promise.all([
    searchByKeyword(query, { ...options, limit: limit * 2 }),
    searchBySemantic(query, { ...options, limit: limit * 2 }),
  ])

  // 合并结果并去重
  const resultMap = new Map<string, SearchResult>()

  // 添加关键词搜索结果（权重 0.6）
  for (const result of keywordResults) {
    const key = result.skill.id
    const existing = resultMap.get(key)
    if (existing) {
      existing.score += result.score * 0.6
    } else {
      resultMap.set(key, {
        ...result,
        score: result.score * 0.6,
      })
    }
  }

  // 添加语义搜索结果（权重 0.4）
  for (const result of semanticResults) {
    const key = result.skill.id
    const existing = resultMap.get(key)
    if (existing) {
      existing.score += result.score * 0.4
      if (existing.matchReason && result.matchReason) {
        existing.matchReason += `、${result.matchReason}`
      }
    } else {
      resultMap.set(key, {
        ...result,
        score: result.score * 0.4,
      })
    }
  }

  // 按得分排序并返回前 N 个
  return Array.from(resultMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * 主搜索函数
 */
export async function search(
  query: string,
  options: SearchOptions = { mode: SearchMode.HYBRID }
): Promise<{ results: SearchResult[]; total: number }> {
  if (!query || query.trim().length === 0) {
    return { results: [], total: 0 }
  }

  const trimmedQuery = query.trim()

  let results: SearchResult[]

  switch (options.mode) {
    case SearchMode.KEYWORD:
      results = await searchByKeyword(trimmedQuery, options)
      break
    case SearchMode.SEMANTIC:
      results = await searchBySemantic(trimmedQuery, options)
      break
    case SearchMode.HYBRID:
    default:
      results = await searchByHybrid(trimmedQuery, options)
      break
  }

  // 获取总数（简化处理）
  const total = results.length > 0
    ? await prisma.skill.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { nameZh: { contains: trimmedQuery, mode: 'insensitive' } },
          ],
        },
      })
    : 0

  return { results, total }
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const skills = await prisma.skill.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { startsWith: query, mode: 'insensitive' } },
        { nameZh: { startsWith: query, mode: 'insensitive' } },
      ],
    },
    select: {
      name: true,
      nameZh: true,
    },
    take: limit,
  })

  const suggestions = new Set<string>()
  for (const skill of skills) {
    if (skill.name.toLowerCase().startsWith(query.toLowerCase())) {
      suggestions.add(skill.name)
    }
    if (skill.nameZh?.toLowerCase().startsWith(query.toLowerCase())) {
      suggestions.add(skill.nameZh)
    }
  }

  return Array.from(suggestions).slice(0, limit)
}

/**
 * 获取热门搜索词
 */
export async function getTrendingSearches(limit = 10): Promise<Array<{ term: string; count: number }>> {
  // 实际应用中应该从搜索日志或缓存中获取
  // 这里返回静态数据
  return [
    { term: 'React', count: 1250 },
    { term: 'Next.js', count: 980 },
    { term: '代码审查', count: 756 },
    { term: '测试', count: 654 },
    { term: '部署', count: 543 },
    { term: '设计', count: 432 },
    { term: '文档', count: 321 },
    { term: '性能优化', count: 298 },
    { term: 'AI', count: 276 },
    { term: 'TypeScript', count: 254 },
  ].slice(0, limit)
}
