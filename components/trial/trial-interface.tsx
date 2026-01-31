'use client'

import { useState } from 'react'
import { Loader2, Send, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface TrialInterfaceProps {
  skill: {
    id: string
    name: string
    nameZh: string | null
    description: string
    descriptionZh: string | null
    repository: string
    stars: number
  }
  userCredits: number
  userId: string
}

interface TrialResponseData {
  response: string
  tokensUsed: number
  creditsCost: number
  remainingCredits: number
}

interface TrialResponse {
  success: boolean
  message: string
  data: TrialResponseData
}

interface TrialErrorResponse {
  error: string
  message: string
}

export function TrialInterface({ skill, userCredits, userId }: TrialInterfaceProps) {
  const [userInput, setUserInput] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState(userCredits)
  const [tokensUsed, setTokensUsed] = useState(0)

  const TRIAL_COST = 20 // 每次试用消耗积分

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userInput.trim()) {
      toast.error('请输入你的问题')
      return
    }

    if (credits < TRIAL_COST) {
      toast.error(`积分不足，需要 ${TRIAL_COST} 积分`)
      return
    }

    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill.id,
          userInput,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const successData = data as TrialResponse
        setResponse(successData.data.response)
        setCredits(successData.data.remainingCredits)
        setTokensUsed(successData.data.tokensUsed)
        toast.success(`试用成功！消耗 ${successData.data.creditsCost} 积分`)
      } else {
        const errorData = data as TrialErrorResponse
        toast.error(errorData.message || '试用失败')
      }
    } catch (error) {
      console.error('试用请求失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExample = (example: string) => {
    setUserInput(example)
  }

  const examples = [
    '你好，请介绍一下你自己',
    '帮我分析一下这个代码的时间复杂度',
    '请帮我优化这段代码的性能',
    '请解释一下 React 的 hooks 原理',
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 头部信息 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            在线试用 - {skill.nameZh || skill.name}
          </h1>
          <p className="text-gray-400 mb-4">
            {skill.descriptionZh || skill.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span>消耗 {TRIAL_COST} 积分/次</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>当前积分: {credits}</span>
            </div>
          </div>
        </div>

        {/* 试用界面 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 输入区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                你的问题
              </label>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入你想问的问题..."
                rows={4}
                className="bg-gray-900/50 border-gray-600 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* 示例问题 */}
            <div>
              <p className="text-sm text-gray-400 mb-2">示例问题：</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExample(example)}
                    disabled={isLoading}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  正在思考...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  发送（消耗 {TRIAL_COST} 积分）
                </>
              )}
            </Button>
          </form>

          {/* 响应区域 */}
          {response && (
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">AI 回复</h3>
                <div className="text-xs text-gray-500">
                  消耗: {tokensUsed} tokens
                </div>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <pre className="whitespace-pre-wrap break-words">{response}</pre>
              </div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            💡 使用说明
          </h3>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>每次试用消耗 {TRIAL_COST} 积分</li>
            <li>请确保你的问题与技能相关，以获得最佳效果</li>
            <li>试用结果由 AI 生成，可能不完全准确</li>
            <li>积分不足？查看如何获取更多积分</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
