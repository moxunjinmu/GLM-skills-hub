import { prisma } from '@/lib/db'
import { SearchPage } from '@/components/search/search-page'

interface SearchPageProps {
  searchParams: {
    q?: string
    page?: string
  }
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
  }

  // 获取热门搜索和建议
  const [popularSearches, suggestedSkills] = await Promise.all([
    getPopularSearches(),
    getSuggestedSkills(),
  ])

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
async function getPopularSearches() {
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
