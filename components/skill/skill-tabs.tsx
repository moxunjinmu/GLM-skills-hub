'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SkillTabsProps {
  skill: {
    name: string
    nameZh: string | null
    description: string
    descriptionZh: string | null
    skillMdContent: string | null
    readmeContent: string | null
    installCommand: string | null
    repository: string
  }
}

export function SkillTabs({ skill }: SkillTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
        <TabsTrigger value="overview">概述</TabsTrigger>
        <TabsTrigger value="usage">使用指南</TabsTrigger>
        <TabsTrigger value="code">代码</TabsTrigger>
        <TabsTrigger value="reviews">评价</TabsTrigger>
      </TabsList>

      {/* 概述标签页 */}
      <TabsContent value="overview" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">关于这个 Skill</h2>
          <p className="text-muted-foreground leading-relaxed">
            {skill.descriptionZh || skill.description}
          </p>
        </div>

        {skill.readmeContent && (
          <div>
            <h3 className="text-xl font-semibold mb-3">详细说明</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/50 p-6 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {skill.readmeContent}
              </pre>
            </div>
          </div>
        )}
      </TabsContent>

      {/* 使用指南标签页 */}
      <TabsContent value="usage" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">安装</h2>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <code className="text-sm">{skill.installCommand || `npx skills add ${skill.repository}`}</code>
          </div>
          <p className="text-sm text-muted-foreground">
            复制上面的命令到终端运行即可安装这个 Skill。
          </p>
        </div>

        {skill.skillMdContent && (
          <div>
            <h2 className="text-2xl font-bold mb-4">使用说明</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap">{skill.skillMdContent}</pre>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">注意事项</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>确保你的系统已安装 Node.js</li>
            <li>需要 Claude Code 或其他兼容的 AI 编码工具</li>
            <li>首次使用可能需要配置环境变量</li>
          </ul>
        </div>
      </TabsContent>

      {/* 代码标签页 */}
      <TabsContent value="code" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">SKILL.md</h2>
          {skill.skillMdContent ? (
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{skill.skillMdContent}</pre>
            </div>
          ) : (
            <p className="text-muted-foreground">暂无代码内容</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">查看源码</h3>
          <a
            href={`https://github.com/${skill.repository}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            在 GitHub 上查看完整源码 →
          </a>
        </div>
      </TabsContent>

      {/* 评价标签页 */}
      <TabsContent value="reviews" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">用户评价</h2>
          <p className="text-sm text-muted-foreground mb-6">
            暂无评价，快来发表第一个评价吧！
          </p>

          {/* 评价表单 */}
          <div className="bg-muted/50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">发表评价</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-2xl hover:text-yellow-500 transition-colors"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">评论内容</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg bg-background"
                  placeholder="分享你的使用体验..."
                />
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                提交评价
              </button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
