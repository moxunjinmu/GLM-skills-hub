'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check, ExternalLink, BookOpen, Code, MessageSquare } from 'lucide-react'

interface SkillTabsProps {
  skill: {
    name: string
    nameZh: string | null
    description: string
    descriptionZh: string | null
    skillMdContent: string | null
    skillMdContentZh: string | null
    readmeContent: string | null
    readmeContentZh: string | null
    installCommand: string | null
    repository: string
    lastCommit: Date | null
    marketplaceJson: any
  }
}

export function SkillTabs({ skill }: SkillTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderMarkdown = (content: string) => {
    // 简单的 Markdown 渲染（生产环境应使用 react-markdown 等库）
    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </pre>
      </div>
    )
  }

  const defaultInstallCommand = skill.installCommand || `npx skills add ${skill.repository}`

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
        <TabsTrigger value="overview" className="gap-2">
          <BookOpen className="w-4 h-4" />
          概述
        </TabsTrigger>
        <TabsTrigger value="usage" className="gap-2">
          <Code className="w-4 h-4" />
          使用指南
        </TabsTrigger>
        <TabsTrigger value="source" className="gap-2">
          <ExternalLink className="w-4 h-4" />
          源码
        </TabsTrigger>
        <TabsTrigger value="reviews" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          评价
        </TabsTrigger>
      </TabsList>

      {/* 概述标签页 */}
      <TabsContent value="overview" className="space-y-6 mt-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">关于这个 Skill</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            {skill.descriptionZh || skill.description}
          </p>
        </div>

        {(skill.readmeContentZh || skill.readmeContent) && (
          <div>
            <h3 className="text-xl font-semibold mb-3">详细说明</h3>
            <div className="bg-muted/50 border rounded-lg p-6">
              {renderMarkdown(skill.readmeContentZh || skill.readmeContent)}
              {!skill.readmeContentZh && (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  英文原文 • 中文翻译即将上线
                </p>
              )}
            </div>
          </div>
        )}

        {skill.marketplaceJson && (
          <div>
            <h3 className="text-xl font-semibold mb-3">能力详情</h3>
            <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">描述:</span> {skill.marketplaceJson.description || '-'}
              </p>
              {skill.marketplaceJson.author && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">作者:</span> {skill.marketplaceJson.author}
                </p>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      {/* 使用指南标签页 */}
      <TabsContent value="usage" className="space-y-6 mt-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">安装命令</h2>
          <div className="bg-muted border rounded-lg p-4 mb-4 flex items-center justify-between gap-4">
            <code className="text-sm font-mono flex-1 overflow-x-auto">{defaultInstallCommand}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(defaultInstallCommand)}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            复制上面的命令到终端运行即可安装这个 Skill。
          </p>
        </div>

        {(skill.skillMdContentZh || skill.skillMdContent) && (
          <div>
            <h2 className="text-2xl font-bold mb-4">使用说明</h2>
            <div className="bg-muted/30 border rounded-lg p-6">
              {renderMarkdown(skill.skillMdContentZh || skill.skillMdContent)}
              {!skill.skillMdContentZh && (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  英文原文 • 中文翻译即将上线
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">使用前提</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>确保你的系统已安装 Node.js (v18 或更高版本)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>需要 Claude Code 或其他兼容的 AI 编码工具</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>首次使用可能需要配置环境变量或 API 密钥</span>
            </li>
          </ul>
        </div>
      </TabsContent>

      {/* 源码标签页 */}
      <TabsContent value="source" className="space-y-6 mt-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">GitHub 仓库</h2>
          <div className="bg-muted/30 border rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">仓库地址</p>
              <a
                href={`https://github.com/${skill.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                github.com/{skill.repository}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {skill.lastCommit && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">最后更新</p>
                <p className="text-sm">{new Date(skill.lastCommit).toLocaleDateString('zh-CN')}</p>
              </div>
            )}
          </div>
        </div>

        {(skill.skillMdContentZh || skill.skillMdContent) && (
          <div>
            <h2 className="text-2xl font-bold mb-4">SKILL.md 内容</h2>
            <div className="bg-muted border rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm font-mono">{skill.skillMdContentZh || skill.skillMdContent}</pre>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button asChild>
            <a
              href={`https://github.com/${skill.repository}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              访问 GitHub
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`https://github.com/${skill.repository}/blob/main/SKILL.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              查看 SKILL.md
            </a>
          </Button>
        </div>
      </TabsContent>

      {/* 评价标签页 */}
      <TabsContent value="reviews" className="space-y-6 mt-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">用户评价</h2>
          <p className="text-sm text-muted-foreground mb-6">
            暂无评价，快来发表第一个评价吧！
          </p>

          {/* 评价表单 */}
          <div className="bg-muted/30 border rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">发表评价</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-2xl text-muted hover:text-yellow-500 transition-colors"
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">评论内容</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg bg-background resize-none"
                  placeholder="分享你的使用体验..."
                />
              </div>
              <Button>提交评价</Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
