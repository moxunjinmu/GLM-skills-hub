/**
 * 智谱清言 API 客户端
 * 文档: https://open.bigmodel.cn/
 */

interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ZhipuRequest {
  model: string
  messages: ZhipuMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
}

interface ZhipuResponse {
  id: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 智谱清言 API 配置
 */
const ZHIPU_CONFIG = {
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  // 默认使用 GLM-4-Flash（更快且便宜）
  defaultModel: 'glm-4-flash',
  // 可选模型：glm-4-plus, glm-4-0520, glm-4-air, glm-4
}

/**
 * 获取 API Key
 */
function getAPIKey(): string {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未配置')
  }
  return apiKey
}

/**
 * 调用智谱清言 API
 */
export async function callZhipuAPI(params: {
  messages: ZhipuMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}): Promise<ZhipuResponse> {
  const { messages, model = ZHIPU_CONFIG.defaultModel, temperature = 0.7, maxTokens = 4096, stream = false } = params

  const request: ZhipuRequest = {
    model,
    messages,
    temperature,
    top_p: 0.9,
    max_tokens: maxTokens,
    stream,
  }

  const response = await fetch(`${ZHIPU_CONFIG.baseURL}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIKey()}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`智谱 API 调用失败: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * 简化的聊天接口
 */
export async function chat(messages: ZhipuMessage[], options?: {
  model?: string
  temperature?: number
  maxTokens?: number
}): Promise<string> {
  const response = await callZhipuAPI({
    messages,
    ...options,
  })

  if (response.choices.length === 0) {
    throw new Error('智谱 API 返回空响应')
  }

  return response.choices[0].message.content
}

type ChatStreamOptions = {
  model?: string
  temperature?: number
  maxTokens?: number
}

type OnChunkCallback = (content: string) => void

/**
 * 流式聊天
 */
export async function chatStream(
  messages: ZhipuMessage[],
  onChunk: OnChunkCallback,
  options?: ChatStreamOptions
): Promise<void> {
  const { model = ZHIPU_CONFIG.defaultModel, temperature = 0.7, maxTokens = 4096 } = options || {}

  const request: ZhipuRequest = {
    model,
    messages,
    temperature,
    top_p: 0.9,
    max_tokens: maxTokens,
    stream: true,
  }

  const response = await fetch(`${ZHIPU_CONFIG.baseURL}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIKey()}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`智谱 API 调用失败: ${response.status} - ${errorText}`)
  }

  // 处理流式响应
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            onChunk(content)
          }
        } catch (e) {
          // 忽略非 JSON 行
        }
      }
    }
  }
}
