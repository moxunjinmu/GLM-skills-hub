'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Search,
  Rocket,
  FileCode,
  GitPullRequest,
  Users,
  Settings,
  Heart,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

/**
 * 文档章节类型
 */
interface DocSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  topics: DocTopic[]
}

interface DocTopic {
  title: string
  description: string
  href?: string
}

/**
 * 文档数据
 */
const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: '快速开始',
    description: '了解如何使用 GLM Skills Hub',
    icon: <Rocket className="h-5 w-5" />,
    topics: [
      {
        title: '什么是 Skills？',
        description: '了解 Claude Skills 的基本概念和用途',
      },
      {
        title: '浏览和搜索 Skills',
        description: '如何找到你需要的 Skills',
      },
      {
        title: '安装 Skills',
        description: '通过 CLI 安装和使用 Skills',
      },
      {
        title: '在线试用',
        description: '无需安装，直接在线体验 Skills',
      },
    ],
  },
  {
    id: 'user-guide',
    title: '用户指南',
    description: '深入使用平台的各项功能',
    icon: <BookOpen className="h-5 w-5" />,
    topics: [
      {
        title: '账号与登录',
        description: '使用 GitHub 账号登录平台',
      },
      {
        title: '收藏和历史',
        description: '管理你收藏的 Skills 和使用记录',
      },
      {
        title: '积分系统',
        description: '了解如何获取和使用积分',
      },
      {
        title: '评分和评论',
        description: '为 Skills 评分，分享使用心得',
      },
    ],
  },
  {
    id: 'contributing',
    title: '贡献指南',
    description: '参与贡献，帮助社区成长',
    icon: <GitPullRequest className="h-5 w-5" />,
    topics: [
      {
        title: '提交 Skill',
        description: '分享你的 Skill 到平台',
        href: '/contribute',
      },
      {
        title: '贡献翻译',
        description: '帮助翻译 Skills 文档',
        href: '/translate',
      },
      {
        title: '报告问题',
        description: '发现 Bug？请告诉我们',
      },
      {
        title: '功能建议',
        description: '有好的想法？欢迎提出建议',
      },
    ],
  },
  {
    id: 'developer',
    title: '开发者文档',
    description: '面向开发者的技术文档',
    icon: <FileCode className="h-5 w-5" />,
    topics: [
      {
        title: '创建 Skill',
        description: '从零开始创建你的第一个 Skill',
      },
      {
        title: 'SKILL.md 规范',
        description: '编写符合规范的 Skill 描述文件',
      },
      {
        title: 'API 文档',
        description: '使用平台 API 构建集成',
      },
      {
        title: 'CLI 参考',
        description: '命令行工具完整参考',
      },
    ],
  },
  {
    id: 'community',
    title: '社区',
    description: '加入社区，与其他开发者交流',
    icon: <Users className="h-5 w-5" />,
    topics: [
      {
        title: 'GitHub 仓库',
        description: '查看源代码，提交 Issue 和 PR',
      },
      {
        title: 'Discord 社区',
        description: '加入我们的 Discord 服务器',
      },
      {
        title: '贡献者名单',
        description: '感谢所有贡献者的付出',
      },
      {
        title: '行为准则',
        description: '社区行为准则和规范',
      },
    ],
  },
  {
    id: 'about',
    title: '关于',
    description: '了解项目和团队',
    icon: <Heart className="h-5 w-5" />,
    topics: [
      {
        title: '关于我们',
        description: 'GLM Skills Hub 的使命和愿景',
      },
      {
        title: '更新日志',
        description: '查看版本更新历史',
      },
      {
        title: '路线图',
        description: '了解未来的开发计划',
      },
      {
        title: '联系我们',
        description: '有问题？联系我们的团队',
      },
    ],
  },
]

/**
 * 使用文档页面组件
 */
export function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤文档章节
  const filteredSections = docSections.map((section) => ({
    ...section,
    topics: section.topics.filter((topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((section) => section.topics.length > 0)

  return (
    <div className="container py-12">
      {/* 页面头部 */}
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">使用文档</h1>
        <p className="text-lg text-muted-foreground">
          了解如何使用 GLM Skills Hub，浏览 Skills，贡献代码
        </p>
      </div>

      {/* 搜索框 */}
      <div className="max-w-2xl mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索文档..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 快速链接 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              快速开始
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">5 分钟快速上手</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('contributing')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-primary" />
              贡献指南
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">参与社区贡献</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('developer')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              开发者文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">创建你的 Skill</p>
          </CardContent>
        </Card>
      </div>

      {/* 文档章节 */}
      <div className="space-y-12">
        {filteredSections.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {section.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <div className="grid gap-4">
              {section.topics.map((topic, idx) => (
                <Card
                  key={idx}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{topic.title}</CardTitle>
                        <CardDescription>{topic.description}</CardDescription>
                      </div>
                      {topic.href ? (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={topic.href}>
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" disabled>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 外部资源 */}
      <div className="mt-16 p-6 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          更多资源
        </h3>
        <div className="grid gap-3 text-sm">
          <a
            href="https://skills.sh/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors"
          >
            <span>Anthropic Skills 官方文档</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="https://github.com/anthropics/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors"
          >
            <span>官方 Skills 仓库</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="https://github.com/anthropics/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors"
          >
            <span>Claude Code 文档</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  )
}
