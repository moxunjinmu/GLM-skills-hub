'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Github, Languages, FileText, Send, CheckCircle2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

// 模拟待翻译的 Skills
const mockSkillsNeedingTranslation = [
  {
    id: '1',
    name: 'code-reviewer',
    description: 'Automated code review tool powered by AI',
    fields: ['description', 'usageGuide'],
  },
  {
    id: '2',
    name: 'api-generator',
    description: 'Generate REST API from database schema',
    fields: ['description', 'examples'],
  },
  {
    id: '3',
    name: 'test-helper',
    description: 'Generate unit tests automatically',
    fields: ['description', 'usageGuide'],
  },
]

/**
 * 贡献翻译页面组件
 */
export function TranslatePage() {
  const [formData, setFormData] = useState({
    skillName: '',
    field: '',
    originalText: '',
    translatedText: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 处理表单提交
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.skillName || !formData.field || !formData.translatedText) {
      toast.error('请填写必填项')
      return
    }

    setIsSubmitting(true)

    try {
      // 提交到后端 API
      const response = await fetch('/api/contributions/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('提交失败')

      toast.success('翻译提交成功！', {
        description: '感谢您的贡献，审核通过后将合并到项目中',
      })

      setFormData({
        skillName: '',
        field: '',
        originalText: '',
        translatedText: '',
      })
    } catch (error) {
      toast.error('提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      {/* 页面头部 */}
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">贡献翻译</h1>
        <p className="text-lg text-muted-foreground">
          帮助我们将更多 Skills 翻译成中文，让国内开发者更容易理解和使用
        </p>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl">
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              翻译指南
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              待翻译列表
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              提交翻译
            </TabsTrigger>
          </TabsList>

          {/* 翻译指南 */}
          <TabsContent value="guide" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  翻译指南
                </CardTitle>
                <CardDescription>
                  了解如何贡献高质量的中文翻译
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 翻译原则 */}
                <div>
                  <h4 className="font-semibold mb-3">翻译原则</h4>
                  <ul className="space-y-2">
                    {[
                      '准确传达原意，不随意增减内容',
                      '使用简洁、专业的技术术语',
                      '保持一致的翻译风格',
                      '保留专有名词（如 React、Next.js 等）',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 翻译字段说明 */}
                <div>
                  <h4 className="font-semibold mb-3">可翻译字段</h4>
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm mb-1">description</p>
                      <p className="text-xs text-muted-foreground">
                        Skill 的描述信息，建议简明扼要地说明功能
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm mb-1">usageGuide</p>
                      <p className="text-xs text-muted-foreground">
                        使用指南，可适当扩展，添加更多说明
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm mb-1">examples</p>
                      <p className="text-xs text-muted-foreground">
                        示例代码注释，保持代码不变，翻译注释
                      </p>
                    </div>
                  </div>
                </div>

                {/* 术语对照表 */}
                <div>
                  <h4 className="font-semibold mb-3">术语对照表</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">英文</th>
                          <th className="text-left py-2 font-medium">中文</th>
                          <th className="text-left py-2 font-medium">备注</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b">
                          <td className="py-2">Skill</td>
                          <td className="py-2">技能 / Skill</td>
                          <td className="py-2">可保留英文</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Agent</td>
                          <td className="py-2">智能体 / Agent</td>
                          <td className="py-2">可保留英文</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Repository</td>
                          <td className="py-2">仓库</td>
                          <td className="py-2">-</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Deployment</td>
                          <td className="py-2">部署</td>
                          <td className="py-2">-</td>
                        </tr>
                        <tr>
                          <td className="py-2">Authentication</td>
                          <td className="py-2">认证 / 身份验证</td>
                          <td className="py-2">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 通过 GitHub 贡献 */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    通过 GitHub 贡献
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    您也可以通过 Fork 仓库，直接修改 JSON 文件中的中文字段
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_ORG || 'your-org'}/GLM-skills-hub`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      前往 GitHub
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 待翻译列表 */}
          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>待翻译 Skills</CardTitle>
                <CardDescription>
                  选择一个 Skill 并贡献翻译
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSkillsNeedingTranslation.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{skill.name}</h4>
                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {skill.fields.map((field) => (
                          <span
                            key={field}
                            className="px-2 py-1 text-xs bg-muted rounded-md"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setFormData({ ...formData, skillName: skill.name })
                          // 切换到提交标签页
                          const submitTab = document.querySelector('[value="submit"]') as HTMLElement
                          submitTab?.click()
                        }}
                      >
                        翻译此 Skill
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  * 这只是示例数据，实际数据将从数据库获取
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 提交翻译表单 */}
          <TabsContent value="submit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  提交翻译
                </CardTitle>
                <CardDescription>
                  填写表单提交您的翻译
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Skill 名称 */}
                  <div className="space-y-2">
                    <Label htmlFor="skillName">
                      Skill 名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="skillName"
                      placeholder="例如：code-reviewer"
                      value={formData.skillName}
                      onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                      required
                    />
                  </div>

                  {/* 翻译字段 */}
                  <div className="space-y-2">
                    <Label htmlFor="field">
                      翻译字段 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="field"
                      placeholder="例如：description, usageGuide, examples"
                      value={formData.field}
                      onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      选择要翻译的字段类型
                    </p>
                  </div>

                  {/* 原文 */}
                  <div className="space-y-2">
                    <Label htmlFor="originalText">原文（可选）</Label>
                    <Textarea
                      id="originalText"
                      placeholder="粘贴需要翻译的原文"
                      value={formData.originalText}
                      onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* 译文 */}
                  <div className="space-y-2">
                    <Label htmlFor="translatedText">
                      中文翻译 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="translatedText"
                      placeholder="输入您的中文翻译"
                      value={formData.translatedText}
                      onChange={(e) => setFormData({ ...formData, translatedText: e.target.value })}
                      required
                      rows={5}
                    />
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '提交中...' : '提交翻译'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        skillName: '',
                        field: '',
                        originalText: '',
                        translatedText: '',
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
