/**
 * 智谱 AI 嵌入服务
 * 使用智谱 AI API 生成文本嵌入向量
 * 文档: https://docs.bigmodel.cn/cn/api/introduction
 */

/**
 * 智谱 AI 嵌入 API 响应
 */
interface ZhipuEmbeddingResponse {
  code: number
  msg: string
  data: {
    embedding: Array<number>
    index: number
    object: string
  }[]
  model: string
  usage: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * 生成文本嵌入向量
 * 使用智谱 AI 的 embedding-3 模型
 *
 * @param text 输入文本
 * @returns 嵌入向量 (1024 维)
 */
export async function generateEmbedding(text: string): Promise<Array<number>> {
  const apiKey = process.env.ZHIPU_API_KEY

  if (!apiKey) {
    console.warn('未配置 ZHIPU_API_KEY，使用简化嵌入生成')
    return generateFallbackEmbedding(text)
  }

  try {
    const response = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'embedding-3',
          input: text,
          encoding_format: 'float',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('智谱 AI API 错误:', error)
      return generateFallbackEmbedding(text)
    }

    const data: ZhipuEmbeddingResponse = await response.json()

    if (data.code !== 0 || !data.data || data.data.length === 0) {
      console.error('智谱 AI API 返回错误:', data)
      return generateFallbackEmbedding(text)
    }

    return data.data[0].embedding
  } catch (error) {
    console.error('调用智谱 AI API 失败:', error)
    return generateFallbackEmbedding(text)
  }
}

/**
 * 批量生成嵌入向量
 *
 * @param texts 输入文本数组
 * @returns 嵌入向量数组
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<Array<Array<number>>> {
  const apiKey = process.env.ZHIPU_API_KEY

  if (!apiKey) {
    return texts.map(generateFallbackEmbedding)
  }

  try {
    const response = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'embedding-3',
          input: texts,
          encoding_format: 'float',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('智谱 AI API 错误:', error)
      return texts.map(generateFallbackEmbedding)
    }

    const data: ZhipuEmbeddingResponse = await response.json()

    if (data.code !== 0 || !data.data || data.data.length === 0) {
      console.error('智谱 AI API 返回错误:', data)
      return texts.map(generateFallbackEmbedding)
    }

    // 按原始顺序排序
    const sortedEmbeddings = data.data.sort((a, b) => a.index - b.index)
    return sortedEmbeddings.map(item => item.embedding)
  } catch (error) {
    console.error('调用智谱 AI API 失败:', error)
    return texts.map(generateFallbackEmbedding)
  }
}

/**
 * 计算余弦相似度
 *
 * @param a 向量 A
 * @param b 向量 B
 * @returns 相似度 (0-1)
 */
export function cosineSimilarity(a: Array<number>, b: Array<number>): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) return 0

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * 降级嵌入生成方法
 * 当智谱 AI API 不可用时使用
 */
function generateFallbackEmbedding(text: string): Array<number> {
  const normalizedText = text.toLowerCase()
  const dimension = 1024 // 与智谱 embedding-3 维度一致
  const vector = new Array<number>(dimension).fill(0)

  // 使用简单的哈希算法生成伪向量
  let hash = 0
  for (let i = 0; i < normalizedText.length; i++) {
    hash = ((hash << 5) - hash) + normalizedText.charCodeAt(i)
    hash = hash & hash
  }

  // 使用多个正弦波填充向量
  for (let i = 0; i < dimension; i++) {
    vector[i] = Math.sin(hash * (i + 1) * 0.01) +
                Math.cos(hash * (i + 1) * 0.02) +
                Math.sin((hash >> 8) * (i + 1) * 0.005)
  }

  // 归一化
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  return magnitude > 0 ? vector.map(val => val / magnitude) : vector
}

/**
 * 文本预处理
 * 移除多余空格、特殊字符等
 */
export function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
}
