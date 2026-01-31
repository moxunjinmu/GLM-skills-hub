import { prisma } from '@/lib/db'
import { SearchPage } from '@/components/search/search-page'

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

/**
 * 搜索页面
 */
export default async function Page({ searchParams }: SearchPageProps) {
  const awaitedParams = await Promise.resolve(searchParams)
  const query = awaitedParams.q || ''
  const page = parseInt(awaitedParams.page || '1')

  // 如果有查询词，执行搜索
  let searchResults = null
  let totalCount = 0

  if (query.trim()) {
    try {
      const limit = 12
      const skip = (page - 1) * limit

      // 构建搜索条件
      const searchCondition = {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { nameZh: { contains: query, mode: 'insensitive' as const } },
          { description: { contains: query, mode: 'insensitive' as const } },
          { descriptionZh: { contains: query, mode: 'insensitive' as const } },
          { skillMdContent: { contains: query, mode: 'insensitive' as const } },
        ],
      }

      // 并行查询结果和总数
      const [results, total] = await Promise.all([
        prisma.skill.findMany({
          where: searchCondition,
          include: {
            categories: true,
            tags: true,
          },
          orderBy: [
            { stars: 'desc' },
            { rating: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.skill.count({ where: searchCondition }),
      ])

      searchResults = results
      totalCount = total
    } catch (error) {
      console.error('Search error:', error)
      // 搜索失败时返回空结果
      searchResults = []
      totalCount = 0
    }
  }

  // 获取热门搜索和建议（添加错误处理）
  let popularSearches: Array<{ term: string; count: number }> = []
  let suggestedSkills: Array<any> = []

  try {
    popularSearches = getPopularSearches()
    suggestedSkills = await getSuggestedSkills()
  } catch (error) {
    console.error('Failed to load search data:', error)
    // 使用默认值
    popularSearches = getPopularSearches()
    suggestedSkills = []
  }

  return (
    <SearchPage
      query={query}
      searchResults={searchResults}
      totalCount={totalCount}
      currentPage={page}
      popularSearches={popularSearches}
      suggestedSkills={suggestedSkills}
    />
  )
}

/**
 * 获取热门搜索词
 */
function getPopularSearches() {
  // 返回一些预设的热门搜索词
  return [
    { term: 'React', count: 1250 },
    { term: 'Next.js', count: 980 },
    { term: '代码审查', count: 756 },
    { term: '测试', count: 654 },
    { term: '部署', count: 543 },
    { term: '设计', count: 432 },
    { term: '文档', count: 321 },
    { term: '性能优化', count: 298 },
  ]
}

/**
 * 获取推荐 Skills
 */
async function getSuggestedSkills() {
  return prisma.skill.findMany({
    where: {
      isActive: true,
      featured: true,
    },
    include: {
      categories: true,
      tags: true,
    },
    take: 6,
    orderBy: {
      stars: 'desc',
    },
  })
}
