import { RankingPage } from '@/components/ranking/ranking-page'

export const dynamic = 'force-dynamic'

interface RankingPageProps {
  searchParams: Promise<{
    type?: string
    period?: string
    category?: string
  }>
}

/**
 * 技能榜单页面
 */
export default async function Page({ searchParams }: RankingPageProps) {
  const awaitedParams = await Promise.resolve(searchParams)
  const type = awaitedParams.type || 'trending'
  const period = awaitedParams.period || 'all'
  const category = awaitedParams.category

  // 获取榜单数据
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rankings?type=${type}&period=${period}${category ? `&category=${category}` : ''}`, {
    cache: 'no-store',
  })

  const data = await response.json()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <RankingPage initialData={data.success ? data.data : null} />
    </div>
  )
}
