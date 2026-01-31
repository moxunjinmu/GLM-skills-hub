'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  User,
  Heart,
  MessageSquare,
  Clock,
  Coins,
  Calendar,
  CheckCircle,
  Star,
  Zap,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { SkillCard } from '@/components/skill/skill-card'

type TabType = 'overview' | 'favorites' | 'history' | 'reviews' | 'credits'

interface UserProfileProps {
  userId: string
  initialTab?: TabType
}

export function UserProfile({ userId, initialTab = 'overview' }: UserProfileProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update: updateSession } = useSession()

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')

  const tabs: Array<{ value: TabType; label: string; icon: any }> = [
    { value: 'overview', label: '概览', icon: User },
    { value: 'favorites', label: '收藏', icon: Heart },
    { value: 'history', label: '历史', icon: Clock },
    { value: 'reviews', label: '评价', icon: MessageSquare },
    { value: 'credits', label: '积分', icon: Coins },
  ]

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/user/profile?tab=${activeTab}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        if (result.data.user?.bio) {
          setBio(result.data.user.bio)
        }
      }
    } catch (error) {
      console.error('获取用户数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveBio() {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('资料更新成功')
        setIsEditing(false)
        setData((prev: any) => ({
          ...prev,
          user: { ...prev.user, bio },
        }))
      } else {
        toast.error(result.message || '更新失败')
      }
    } catch (error) {
      console.error('更新资料失败:', error)
      toast.error('网络错误，请稍后重试')
    }
  }

  async function handleSignIn() {
    try {
      const response = await fetch('/api/credits/checkin', { method: 'POST' })
      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || '签到成功！')
        fetchData()
      } else {
        toast.error(result.message || '签到失败')
      }
    } catch (error) {
      console.error('签到失败:', error)
      toast.error('网络错误，请稍后重试')
    }
  }

  function handleTabChange(tab: TabType) {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/me?${params.toString()}`)
  }

  function getCreditReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      REGISTER: '注册奖励',
      DAILY_CHECKIN: '每日签到',
      SUBMIT_SKILL: '提交技能',
      TRANSLATE: '贡献翻译',
      INVITE: '邀请用户',
      TRIAL_USE: '试用消耗',
      AI_SEARCH: 'AI 搜索消耗',
      MANUAL_ADJUST: '手动调整',
    }
    return labels[reason] || reason
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      VIEW: '查看',
      TRIAL: '试用',
      INSTALL: '安装',
      FAVORITE: '收藏',
    }
    return labels[action] || action
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-400">用户不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 头部用户信息 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {data.user.name?.[0] || 'U'}
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {data.user.name || '未设置名称'}
                  </h1>
                  <p className="text-sm text-gray-400 mb-3">
                    {data.user.email || '未设置邮箱'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      设置
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    退出
                  </Button>
                </div>
              </div>

              {/* 个人简介 */}
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="介绍一下自己..."
                    rows={3}
                    className="bg-gray-900/50 border-gray-600"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveBio}>
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setBio(data.user.bio || '')
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-300">
                    {data.user.bio || '这个人很懒，还没有填写简介...'}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    编辑简介
                  </Button>
                </div>
              )}

              {/* 积分和加入时间 */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-semibold">{data.user.credits}</span>
                  <span className="text-gray-400 text-sm">积分</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(data.user.createdAt).toLocaleDateString('zh-CN')} 加入
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTabChange(tab.value)}
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* 标签页内容 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* 概览 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-pink-500/20 rounded-lg">
                          <Heart className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {data.stats?.favoriteCount || 0}
                          </div>
                          <div className="text-sm text-gray-400">收藏</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <MessageSquare className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {data.stats?.reviewCount || 0}
                          </div>
                          <div className="text-sm text-gray-400">评价</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                          <Zap className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {data.stats?.usageCount || 0}
                          </div>
                          <div className="text-sm text-gray-400">使用次数</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 每日签到 */}
                  {!data.stats?.hasCheckedInToday && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-yellow-500/30 rounded-full">
                            <Zap className="h-6 w-6 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-white font-semibold">每日签到</div>
                            <div className="text-sm text-gray-400">
                              签到可获得 10 积分奖励
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleSignIn}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          立即签到
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 最近积分记录 */}
                  {data.recentCredits && data.recentCredits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">最近积分记录</h3>
                      <div className="space-y-2">
                        {data.recentCredits.map((log: any) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-900/30 rounded-lg"
                          >
                            <div>
                              <div className="text-white">{log.description || getCreditReasonLabel(log.reason)}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleString('zh-CN')}
                              </div>
                            </div>
                            <div
                              className={`font-semibold ${
                                log.amount > 0 ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {log.amount > 0 ? '+' : ''}{log.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 收藏 */}
              {activeTab === 'favorites' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    我的收藏 ({data.pagination?.total || 0})
                  </h3>
                  {data.favorites && data.favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.favorites.map((item: any) => (
                        <SkillCard key={item.id} skill={item.skill} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      还没有收藏任何技能
                    </div>
                  )}
                </div>
              )}

              {/* 历史 */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    使用历史 ({data.pagination?.total || 0})
                  </h3>
                  {data.logs && data.logs.length > 0 ? (
                    <div className="space-y-3">
                      {data.logs.map((log: any) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-3 px-4 bg-gray-900/30 rounded-lg border border-gray-700"
                        >
                          <div className="flex-1">
                            <Link
                              href={`/skills/${log.skill.slug}`}
                              className="text-white hover:text-blue-400 transition-colors"
                            >
                              {log.skill.nameZh || log.skill.name}
                            </Link>
                            <div className="text-sm text-gray-400 mt-1">
                              <span className="mr-3">
                                {getActionLabel(log.action)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                          </div>
                          {log.creditsCost > 0 && (
                            <div className="text-red-400 text-sm">
                              -{log.creditsCost} 积分
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      还没有使用记录
                    </div>
                  )}
                </div>
              )}

              {/* 评价 */}
              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    我的评价 ({data.pagination?.total || 0})
                  </h3>
                  {data.reviews && data.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {data.reviews.map((review: any) => (
                        <div
                          key={review.id}
                          className="bg-gray-900/30 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Link
                                href={`/skills/${review.skill.slug}`}
                                className="text-white hover:text-blue-400 transition-colors font-medium"
                              >
                                {review.skill.nameZh || review.skill.name}
                              </Link>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                          {review.content && (
                            <p className="text-gray-300 mt-2">{review.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      还没有评价任何技能
                    </div>
                  )}
                </div>
              )}

              {/* 积分 */}
              {activeTab === 'credits' && (
                <div className="space-y-6">
                  {/* 积分统计 */}
                  {data.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">当前积分</div>
                        <div className="text-2xl font-bold text-white">
                          {data.user.credits}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">累计获得</div>
                        <div className="text-2xl font-bold text-green-400">
                          +{data.stats.earned}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">累计消费</div>
                        <div className="text-2xl font-bold text-red-400">
                          -{data.stats.spent}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 积分记录 */}
                  {data.logs && data.logs.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">积分记录</h3>
                      <div className="space-y-2">
                        {data.logs.map((log: any) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between py-3 px-4 bg-gray-900/30 rounded-lg"
                          >
                            <div>
                              <div className="text-white">
                                {log.description || getCreditReasonLabel(log.reason)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleString('zh-CN')}
                              </div>
                            </div>
                            <div
                              className={`font-semibold text-lg ${
                                log.amount > 0 ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {log.amount > 0 ? '+' : ''}{log.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      暂无积分记录
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
