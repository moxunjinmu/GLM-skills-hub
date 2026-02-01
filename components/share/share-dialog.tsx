'use client'

import { useState, useEffect } from 'react'
import {
  Share2,
  X,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface ShareDialogProps {
  skillId: string
  isOpen: boolean
  onClose: () => void
}

interface ShareData {
  url: string
  title: string
  description: string
  platforms: {
    twitter: { url: string; name: string }
    weibo: { url: string; name: string }
    wechat: { url: string; name: string; isQrCode?: boolean }
    linkedin: { url: string; name: string }
    copy: { url: string; name: string }
  }
}

export function ShareDialog({ skillId, isOpen, onClose }: ShareDialogProps) {
  const { data: session } = useSession()
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rewarded, setRewarded] = useState(false)

  useEffect(() => {
    if (isOpen && skillId) {
      fetchShareData()
    }
  }, [isOpen, skillId])

  async function fetchShareData() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/share?skillId=${skillId}`)
      const result = await response.json()
      if (result.success) {
        setShareData(result.data)
      }
    } catch (error) {
      console.error('获取分享数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleShare(platform: string, url: string) {
    // 打开分享链接
    window.open(url, '_blank', 'width=600,height=400')

    // 如果用户已登录，记录分享并奖励积分
    if (session?.user && !rewarded) {
      try {
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId, platform }),
        })

        const result = await response.json()

        if (response.ok && result.data.rewarded) {
          setRewarded(true)
          toast.success(result.message)
        }
      } catch (error) {
        console.error('记录分享失败:', error)
      }
    }
  }

  async function handleCopy() {
    if (!shareData) return

    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      toast.success('链接已复制到剪贴板')

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">分享技能</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : shareData ? (
            <div className="space-y-4">
              {/* 链接预览 */}
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <p className="text-sm text-white font-medium mb-1">{shareData.title}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{shareData.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={shareData.url}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 分享按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleShare('twitter', shareData.platforms.twitter.url)}
                >
                  <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                  {shareData.platforms.twitter.name}
                </Button>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleShare('weibo', shareData.platforms.weibo.url)}
                >
                  <Share2 className="h-4 w-4 mr-2 text-red-500" />
                  {shareData.platforms.weibo.name}
                </Button>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    toast.info('请截图分享到微信')
                    handleShare('wechat', shareData.platforms.wechat.url)
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2 text-green-500" />
                  {shareData.platforms.wechat.name}
                </Button>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleShare('linkedin', shareData.platforms.linkedin.url)}
                >
                  <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                  {shareData.platforms.linkedin.name}
                </Button>
              </div>

              {/* 提示信息 */}
              {session?.user ? (
                rewarded ? (
                  <div className="text-center text-sm text-green-400 bg-green-500/10 rounded-lg py-2 px-3">
                    ✓ 已获得分享奖励
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400">
                    分享到社交媒体可获得 5 积分奖励（每日最多 5 次）
                  </div>
                )
              ) : (
                <div className="text-center text-xs text-gray-400">
                  登录后分享可获得积分奖励
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              加载失败，请重试
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-700">
          <Button variant="outline" className="w-full" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}
