'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Github, CheckCircle2, AlertCircle, FileCode, GitPullRequest, Send } from 'lucide-react'
import { toast } from 'sonner'

/**
 * 贡献 Skills 页面组件
 */
export function ContributePage() {
  const [formData, setFormData] = useState({
    name: '',
    repository: '',
    description: '',
    category: '',
    whyUseful: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 处理表单提交
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 验证表单
    if (!formData.name || !formData.repository || !formData.description) {
      toast.error('请填写必填项', {
        description: '名称、仓库地址和描述为必填项',
      })
      return
    }

    // 验证 GitHub 仓库地址
    const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+/
    if (!githubUrlPattern.test(formData.repository)) {
      toast.error('仓库地址格式不正确', {
        description: '请输入有效的 GitHub 仓库地址',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 提交到后端 API
      const response = await fetch('/api/contributions/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('提交失败')
      }

      toast.success('提交成功！', {
        description: '您的 Skill 已提交，我们会在 1-2 个工作日内审核',
      })

      // 重置表单
      setFormData({
        name: '',
        repository: '',
        description: '',
        category: '',
        whyUseful: '',
      })
    } catch (error) {
      toast.error('提交失败', {
        description: '请稍后重试或通过 GitHub PR 提交',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      {/* 页面头部 */}
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">贡献 Skills</h1>
        <p className="text-lg text-muted-foreground">
          分享您的 AI Agent Skill，帮助更多开发者发现并使用它
        </p>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl">
        <Tabs defaultValue="github" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub PR（推荐）
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              在线表单
            </TabsTrigger>
          </TabsList>

          {/* GitHub PR 方式 */}
          <TabsContent value="github" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5" />
                  通过 GitHub PR 提交
                </CardTitle>
                <CardDescription>
                  推荐方式：Fork 仓库，添加 Skill，提交 PR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 步骤说明 */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Fork 仓库</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        访问我们的 GitHub 仓库并点击 Fork 按钮
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href="https://github.com/your-org/glm-skills-hub"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Github className="h-4 w-4" />
                          前往 GitHub
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">添加 Skill</h4>
                      <p className="text-sm text-muted-foreground">
                        在 <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                          data/skills/
                        </code>{' '}
                        目录下创建新的 JSON 文件
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">提交 PR</h4>
                      <p className="text-sm text-muted-foreground">
                        创建 Pull Request，描述您的 Skill 功能和使用方法
                      </p>
                    </div>
                  </div>
                </div>

                {/* 文件格式说明 */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Skill 文件格式
                  </h4>
                  <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "name": "skill-name",
  "nameZh": "技能中文名",
  "description": "Skill description",
  "descriptionZh": "技能中文描述",
  "repository": "https://github.com/user/repo",
  "author": "author-name",
  "icon": "🔧",
  "category": "dev-tools",
  "tags": ["react", "nextjs"],
  "installCommand": "npm install skill-name"
}`}
                  </pre>
                </div>

                {/* 检查清单 */}
                <div>
                  <h4 className="font-semibold mb-3">提交清单</h4>
                  <ul className="space-y-2">
                    {[
                      'SKILL.md 文件符合规范',
                      '项目描述清晰，包含使用示例',
                      '代码仓库公开可访问',
                      '许可证信息明确',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 审核说明 */}
                <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-500 mb-1">审核说明</p>
                    <p className="text-muted-foreground">
                      我们会在 1-2 个工作日内审核您的提交。审核通过后，您的 Skill 将被收录到平台。
                      如有问题，我们会通过 PR 评论反馈。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 表单提交方式 */}
          <TabsContent value="form" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  在线提交 Skill
                </CardTitle>
                <CardDescription>
                  填写表单，我们会在审核后添加到仓库
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Skill 名称 */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Skill 名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="例如：my-awesome-skill"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* GitHub 仓库 */}
                  <div className="space-y-2">
                    <Label htmlFor="repository">
                      GitHub 仓库地址 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="repository"
                      type="url"
                      placeholder="https://github.com/user/repo"
                      value={formData.repository}
                      onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      请输入 GitHub 仓库的完整 URL
                    </p>
                  </div>

                  {/* 描述 */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      描述 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="描述这个 Skill 的功能和使用场景"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>

                  {/* 分类 */}
                  <div className="space-y-2">
                    <Label htmlFor="category">分类</Label>
                    <Input
                      id="category"
                      placeholder="例如：开发工具、数据处理、AI/ML"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>

                  {/* 为什么有用 */}
                  <div className="space-y-2">
                    <Label htmlFor="whyUseful">为什么这个 Skill 有用？</Label>
                    <Textarea
                      id="whyUseful"
                      placeholder="说明这个 Skill 解决了什么问题，有什么独特的价值"
                      value={formData.whyUseful}
                      onChange={(e) => setFormData({ ...formData, whyUseful: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '提交中...' : '提交审核'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        name: '',
                        repository: '',
                        description: '',
                        category: '',
                        whyUseful: '',
                      })}
                    >
                      重置
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
