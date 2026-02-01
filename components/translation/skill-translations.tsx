'use client'

import { useState } from 'react'
import { Languages, Loader2, Send, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface Translation {
  id: string
  field: string
  contentEn: string
  contentZh: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface SkillTranslationsProps {
  skillId: string
  skillName: string
  skillNameZh: string | null
  description: string
  descriptionZh: string | null
  skillMdContent: string | null
}

const fieldLabels = {
  name: '名称',
  description: '描述',
  skillMdContent: '使用说明 (SKILL.md)',
  readmeContent: 'README 文档',
}

export function SkillTranslations({
  skillId,
  skillName,
  skillNameZh,
  description,
  descriptionZh,
  skillMdContent,
}: SkillTranslationsProps) {
  const { data: session } = useSession()
  const [translations, setTranslations] = useState<Translation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 当前正在翻译的字段
  const [currentField, setCurrentField] = useState<keyof typeof fieldLabels | null>(null)
  const [translationText, setTranslationText] = useState('')

  // 加载翻译列表
  const fetchTranslations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/translations?skillId=${skillId}`)
      const result = await response.json()
      if (result.success) {
        setTranslations(result.data.translations)
      }
    } catch (error) {
      console.error('获取翻译失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 提交翻译
  const handleSubmitTranslation = async () => {
    if (!session?.user) {
      toast.error('请先登录')
      return
    }

    if (!translationText.trim()) {
      toast.error('请输入翻译内容')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          field: currentField,
          contentZh: translationText,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || '翻译提交成功！')
        setTranslationText('')
        setCurrentField(null)
        fetchTranslations()
      } else {
        toast.error(result.message || '提交失败')
      }
    } catch (error) {
      console.error('提交翻译失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取原文内容
  const getOriginalContent = (field: string) => {
    switch (field) {
      case 'name':
        return skillName
      case 'description':
        return description
      case 'skillMdContent':
        return skillMdContent || ''
      case 'readmeContent':
        return 'README 文档翻译功能开发中...'
      default:
        return ''
    }
  }

  // 获取已翻译的内容
  const getTranslatedContent = (field: string) => {
    const translation = translations.find((t) => t.field === field && t.status === 'APPROVED')
    return translation?.contentZh
  }

  // 获取字段的翻译状态
  const getFieldStatus = (field: string) => {
    const translation = translations.find((t) => t.field === field)
    if (!translation) return 'none'
    if (translation.status === 'APPROVED') return 'approved'
    if (translation.status === 'PENDING') return 'pending'
    return 'rejected'
  }

  // 翻译状态组件
  const TranslationStatus = ({ field }: { field: string }) => {
    const status = getFieldStatus(field)
    const translatedContent = getTranslatedContent(field)

    if (status === 'approved' && translatedContent) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">已翻译</span>
        </div>
      )
    }

    if (status === 'pending') {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm">审核中</span>
        </div>
      )
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentField(field as keyof typeof fieldLabels)}
        disabled={!session?.user}
      >
        <Languages className="h-4 w-4 mr-2" />
        翻译
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      {/* 翻译状态概览 */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Languages className="h-5 w-5" />
          翻译状态
        </h3>

        <div className="space-y-3">
          {/* 名称 */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-900/30 rounded-lg">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">{fieldLabels.name}</div>
              <div className="text-white">{skillName}</div>
              {getTranslatedContent('name') && (
                <div className="text-sm text-green-400 mt-1">{getTranslatedContent('name')}</div>
              )}
            </div>
            <TranslationStatus field="name" />
          </div>

          {/* 描述 */}
          <div className="flex items-start justify-between py-2 px-3 bg-gray-900/30 rounded-lg">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">{fieldLabels.description}</div>
              <div className="text-white text-sm line-clamp-2">{description}</div>
              {getTranslatedContent('description') && (
                <div className="text-sm text-green-400 mt-1">{getTranslatedContent('description')}</div>
              )}
            </div>
            <TranslationStatus field="description" />
          </div>

          {/* 使用说明 */}
          <div className="flex items-start justify-between py-2 px-3 bg-gray-900/30 rounded-lg">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">{fieldLabels.skillMdContent}</div>
              <div className="text-white text-xs line-clamp-2">
                {skillMdContent ? '有使用说明' : '暂无使用说明'}
              </div>
            </div>
            <TranslationStatus field="skillMdContent" />
          </div>
        </div>

        {/* 提示信息 */}
        {!session?.user && (
          <div className="text-center text-sm text-gray-400 mt-2">
            登录后可参与翻译贡献
          </div>
        )}
      </div>

      {/* 翻译表单对话框 */}
      {currentField && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                翻译 - {fieldLabels[currentField]}
              </h3>
              <button
                onClick={() => {
                  setCurrentField(null)
                  setTranslationText('')
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 原文内容 */}
            <div className="p-4 border-b border-gray-700">
              <div className="text-sm text-gray-400 mb-2">原文：</div>
              <div className="bg-gray-900/50 rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {getOriginalContent(currentField).substring(0, 1000)}
                  {getOriginalContent(currentField).length > 1000 && '...(已截断)'}
                </pre>
              </div>
            </div>

            {/* 翻译表单 */}
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  中文翻译：
                </label>
                <Textarea
                  value={translationText}
                  onChange={(e) => setTranslationText(e.target.value)}
                  placeholder="请输入中文翻译..."
                  rows={6}
                  className="bg-gray-900/50 border-gray-600 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* 翻译提示 */}
              <div className="text-xs text-gray-500 mb-4">
                • 请准确翻译技术术语和专有名词
                <br />
                • 保持原文格式和结构
                <br />
                • 提交后将进入审核流程，审核通过后将显示给所有用户
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentField(null)
                    setTranslationText('')
                  }}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmitTranslation}
                  disabled={isSubmitting || !translationText.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      提交翻译
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
