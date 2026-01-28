'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

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
  const [copied, setCopied] = useState(false)

  const handleFavorite = async () => {
    // TODO: 实现 API 调用
    setIsFavorited(!isFavorited)
    toast.success(isFavorited ? '已取消收藏' : '已添加到收藏')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: skill.name,
          url,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      await copyToClipboard(url)
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
    <div className="flex items-center gap-2">
      {/* 收藏按钮 */}
      <Button
        variant={isFavorited ? 'default' : 'outline'}
        size="sm"
        onClick={handleFavorite}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        收藏
      </Button>

      {/* 分享按钮 */}
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4" />
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
  )
}
