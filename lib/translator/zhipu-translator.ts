/**
 * 智谱清言翻译服务
 * 用于将英文技能内容翻译为中文
 */

/**
 * 翻译配置
 */
const TRANSLATE_CONFIG = {
  // 是否启用自动翻译
  enabled: !!process.env.ZHIPU_API_KEY,

  // API 配置
  apiKey: process.env.ZHIPU_API_KEY || '',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4-flash', // 使用 GLM-4-Flash 更快更便宜
}

/**
 * 调用智谱 API 进行翻译
 */
async function callZhipuAPI(prompt: string, maxTokens: number = 2000): Promise<string | null> {
  if (!TRANSLATE_CONFIG.enabled) {
    return null
  }

  try {
    const response = await fetch(TRANSLATE_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRANSLATE_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: TRANSLATE_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
        top_p: 0.7,
      }),
      signal: AbortSignal.timeout(30000), // 30 秒超时
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`智谱 API 调用失败: ${response.status} ${errorText}`)
      return null
    }

    const data = await response.json()
    const translated = data.choices?.[0]?.message?.content?.trim()

    if (translated) {
      return translated
    }

    return null
  } catch (error) {
    // 翻译失败不影响主流程，静默失败
    console.warn(`翻译失败: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

/**
 * 翻译文本为中文
 * @param text - 需要翻译的英文文本
 * @param context - 翻译上下文（用于提高准确性）
 * @returns 翻译后的中文文本
 */
export async function translateToChinese(
  text: string,
  context?: string
): Promise<string | null> {
  // 空文本直接返回
  if (!text || text.trim().length === 0) {
    return null
  }

  // 检查文本是否主要是英文（简单检测）
  const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length
  const totalCharCount = text.replace(/\s/g, '').length
  const englishRatio = totalCharCount > 0 ? englishCharCount / totalCharCount : 0

  // 如果英文占比低于 30%，可能已经是中文或其他语言，不需要翻译
  if (englishRatio < 0.3) {
    return null
  }

  const contextHint = context
    ? `\n\n上下文参考：${context}`
    : ''

  const prompt = `请将以下文本翻译为简体中文。要求：
1. 保持专业术语的准确性
2. 保持技术文档的风格
3. 如果是代码、命令、链接等，请保持原样
4. 如果内容已经是中文，请直接返回原文${contextHint}

待翻译文本：
${text}

只返回翻译后的内容，不要有任何解释。`

  const translated = await callZhipuAPI(prompt, 2000)

  // 验证翻译结果
  if (translated && translated !== text) {
    return translated
  }

  return null
}

/**
 * 翻译技能名称
 */
export async function translateSkillName(name: string): Promise<string | null> {
  if (!name) return null

  const prompt = `请将以下技能名称翻译为简体中文。要求：
1. 保持名称简洁专业
2. 保留品牌名、产品名等专有名词的英文形式
3. 如果已经是中文，直接返回原文

技能名称：${name}

只返回翻译后的名称，不要有任何解释。`

  const translated = await callZhipuAPI(prompt, 100)
  return translated && translated !== name ? translated : null
}

/**
 * 翻译技能描述
 */
export async function translateSkillDescription(
  description: string,
  skillName?: string
): Promise<string | null> {
  return translateToChinese(description, skillName ? `技能名称：${skillName}` : undefined)
}

/**
 * 翻译 Markdown 内容（如 SKILL.md）
 * 由于内容可能较长，使用摘要翻译策略
 */
export async function translateMarkdownContent(
  content: string,
  skillName?: string
): Promise<string | null> {
  if (!content || content.length < 50) {
    return null
  }

  // 对于超长内容，只翻译前 2000 字符
  const maxLength = 2000
  const contentToTranslate = content.length > maxLength
    ? content.substring(0, maxLength)
    : content

  const prompt = `请将以下 Markdown 技术文档翻译为简体中文。要求：
1. 保持 Markdown 格式不变
2. 代码块、命令、链接等保持原样
3. 保持技术术语的准确性
4. 只返回翻译内容，不要有任何解释${skillName ? `\n技能名称：${skillName}` : ''}

内容：
${contentToTranslate}`

  const translated = await callZhipuAPI(prompt, 3000)
  return translated && translated !== contentToTranslate ? translated : null
}

/**
 * 批量翻译技能数据
 * @param skillData - 技能数据
 * @returns 带中文翻译的技能数据
 */
export async function translateSkillData(skillData: {
  name: string
  description: string
  skillMdContent?: string | null
  readmeContent?: string | null
}): Promise<{
  nameZh: string | null
  descriptionZh: string | null
  skillMdContentZh?: string | null
  readmeContentZh?: string | null
}> {
  const results: {
    nameZh: string | null
    descriptionZh: string | null
    skillMdContentZh?: string | null
    readmeContentZh?: string | null
  } = {
    nameZh: null,
    descriptionZh: null,
    skillMdContentZh: undefined,
    readmeContentZh: undefined,
  }

  // 并发翻译名称和描述以提高速度
  const translations = await Promise.allSettled([
    translateSkillName(skillData.name),
    translateSkillDescription(skillData.description, skillData.name),
  ])

  results.nameZh = translations[0].status === 'fulfilled' ? translations[0].value : null
  results.descriptionZh = translations[1].status === 'fulfilled' ? translations[1].value : null

  // 对于长内容，使用顺序翻译以避免速率限制
  if (skillData.skillMdContent) {
    try {
      results.skillMdContentZh = await translateMarkdownContent(skillData.skillMdContent, skillData.name)
    } catch {
      // 静默失败
    }
  }

  if (skillData.readmeContent) {
    try {
      results.readmeContentZh = await translateMarkdownContent(skillData.readmeContent, skillData.name)
    } catch {
      // 静默失败
    }
  }

  return results
}
