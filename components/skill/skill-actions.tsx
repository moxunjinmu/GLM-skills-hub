'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ShareDialog } from '@/components/share/share-dialog'

interface SkillActionsProps {
  skill: {
    id: string
    name: string
    slug: string
    repository: string
    installCommand: string | null
  }
}

export function SkillActions({ skill }: SkillActionsProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)

  // 检查是否已收藏
  useEffect(() => {
    async function checkFavorite() {
      try {
        const response = await fetch(`/api/favorites?limit=100`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const favorited = result.data.favorites.some(
              (f: any) => f.skill.id === skill.id
            )
            setIsFavorited(favorited)
          }
        }
      } catch (error) {
        console.error('检查收藏状态失败:', error)
      }
    }
    checkFavorite()
  }, [skill.id])

  const handleFavorite = async () => {
    setIsLoading(true)
    try {
      if (isFavorited) {
        // 取消收藏
        const response = await fetch(`/api/favorites?skillId=${skill.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsFavorited(false)
          toast.success('已取消收藏')
        } else {
          const error = await response.json()
          toast.error(error.message || '取消收藏失败')
        }
      } else {
        // 添加收藏
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId: skill.id }),
        })
        if (response.ok) {
          setIsFavorited(true)
          toast.success('已添加到收藏')
        } else {
          const error = await response.json()
          toast.error(error.message || '添加收藏失败')
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      toast.error('操作失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleCopyInstall = () => {
    if (skill.installCommand) {
      copyToClipboard(skill.installCommand)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 收藏按钮 */}
        <Button
          variant={isFavorited ? 'default' : 'outline'}
          size="sm"
          onClick={handleFavorite}
          disabled={isLoading}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          {isLoading ? '处理中...' : isFavorited ? '已收藏' : '收藏'}
        </Button>

        {/* 分享按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShareDialog(true)}
        >
          分享
        </Button>

        {/* 复制安装命令 */}
        {skill.installCommand && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyInstall}
            className="min-w-[120px]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                复制安装
              </>
            )}
          </Button>
        )}

        {/* GitHub 链接 */}
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://github.com/${skill.repository}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </Button>
      </div>

      {/* 分享对话框 */}
      <ShareDialog
        skillId={skill.id}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  )
}
