import useSWR, { SWRConfiguration } from 'swr'

// 基础 fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || '请求失败')
  }
  return res.json()
}

/**
 * 通用 SWR Hook
 */
export function useApi<T>(url: string, config?: SWRConfiguration) {
  const { data, error, mutate, isLoading } = useSWR<T>(
    url,
    url ? fetcher : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1分钟内不重复请求
      ...config,
    }
  )

  return {
    data,
    error,
    mutate,
    isLoading,
  }
}

/**
 * 获取用户收藏列表
 */
export function useFavorites() {
  return useApi<{ favorites: any[] }>('/api/favorites?limit=100')
}

/**
 * 获取用户积分
 */
export function useUserCredits() {
  return useApi<{ credits: number }>('/api/credits')
}

/**
 * 获取热门搜索词
 */
export function useTrendingSearches() {
  // 热门搜索词变化较慢，可以缓存更长时间
  return useApi<Array<{ term: string; count: number }>>('/api/suggestions', {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5分钟
  })
}

/**
 * 获取榜单数据
 */
export function useRankings(type?: string, period?: string) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (period) params.set('period', period)

  return useApi(`/api/rankings?${params.toString()}`)
}

/**
 * 预取数据的函数
 */
export async function prefetchData(url: string) {
  // 在浏览器环境中，可以使用 SWR 的 mutate 进行预取
  if (typeof window !== 'undefined') {
    const { mutate } = await import('swr')
    mutate(
      url,
      async () => {
        const res = await fetch(url)
        if (!res.ok) throw new Error('预取失败')
        return res.json()
      },
      false // 不重新验证现有数据
    )
  }
}
