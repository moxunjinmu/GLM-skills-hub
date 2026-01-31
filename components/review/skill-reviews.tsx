'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, Send, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface Review {
  id: string
  rating: number
  content: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ReviewsData {
  reviews: Review[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  stats: {
    distribution: Record<number, number>
    total: number
  }
}

interface SkillReviewsProps {
  skillId: string
  initialData?: ReviewsData
}

export function SkillReviews({ skillId, initialData }: SkillReviewsProps) {
  const { data: session } = useSession()
  const [data, setData] = useState<ReviewsData | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 评分表单状态
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    if (!initialData) {
      fetchReviews()
    }
    checkUserReview()
  }, [skillId, currentPage])

  async function fetchReviews() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews?skillId=${skillId}&page=${currentPage}&limit=10`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function checkUserReview() {
    if (!session?.user) return

    try {
      const response = await fetch(`/api/reviews?skillId=${skillId}&limit=100`)
      const result = await response.json()
      if (result.success) {
        const userReview = result.data.reviews.find((r: Review) => r.user.id === session.user.id)
        setHasReviewed(!!userReview)
        if (userReview) {
          setRating(userReview.rating)
          setContent(userReview.content || '')
        }
      }
    } catch (error) {
      console.error('检查用户评论失败:', error)
    }
  }

  async function handleSubmit() {
    if (!session?.user) {
      toast.error('请先登录')
      return
    }

    if (rating === 0) {
      toast.error('请选择评分')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, rating, content }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('评分成功！')
        setHasReviewed(true)
        setContent('')
        fetchReviews()
      } else {
        toast.error(result.message || '评分失败')
      }
    } catch (error) {
      console.error('提交评论失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!session?.user) return

    if (!confirm('确定要删除这条评论吗？')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('删除成功')
        setHasReviewed(false)
        setRating(0)
        setContent('')
        fetchReviews()
      } else {
        toast.error(result.message || '删除失败')
      }
    } catch (error) {
      console.error('删除评论失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const averageRating = data?.stats.total
    ? Object.entries(data.stats.distribution).reduce(
        (sum, [stars, count]) => sum + parseInt(stars) * count,
        0
      ) / data.stats.total
    : 0

  return (
    <div className="space-y-8">
      {/* 评分统计 */}
      {data && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-8">
            {/* 平均评分 */}
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-1">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-400">{data.stats.total} 条评价</div>
            </div>

            {/* 评分分布 */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = data.stats.distribution[stars] || 0
                const percentage = data.stats.total > 0 ? (count / data.stats.total) * 100 : 0

                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 text-sm text-gray-400">
                      <span>{stars}</span>
                      <Star className="h-4 w-4" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-gray-400 text-right">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 评分表单 */}
      {session?.user && !hasReviewed && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">添加评价</h3>

          {/* 星级评分 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-400">评分：</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="text-sm text-yellow-400 ml-2">
                {rating === 5 && '非常棒！'}
                {rating === 4 && '很好'}
                {rating === 3 && '还可以'}
                {rating === 2 && '一般'}
                {rating === 1 && '不满意'}
              </span>
            )}
          </div>

          {/* 评论文本 */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的使用体验（可选）..."
            rows={4}
            className="bg-gray-900/50 border-gray-600 focus:border-blue-500 mb-4"
          />

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                提交评价
              </>
            )}
          </Button>
        </div>
      )}

      {/* 已评分提示 */}
      {hasReviewed && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-blue-400">您已经评价过这个技能了</p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          用户评论 ({data?.pagination.total || 0})
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-lg p-4 animate-pulse">
                <div className="h-4 w-32 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-full bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : data && data.reviews.length > 0 ? (
          <>
            {data.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {review.user.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{review.user.name || '匿名用户'}</div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    {session?.user && session.user.id === review.user.id && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {review.content && (
                  <p className="text-gray-300 mt-2">{review.content}</p>
                )}
              </div>
            ))}

            {/* 分页 */}
            {data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            暂无评论，快来抢沙发吧！
          </div>
        )}
      </div>
    </div>
  )
}
