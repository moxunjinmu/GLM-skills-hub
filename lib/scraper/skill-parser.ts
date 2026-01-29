/**
 * SKILL.md 文件解析器
 * 解析 SKILL.md 文件并提取元数据
 */

import { ParsedSkill, SkillMetadata } from '../../types/index'

/**
 * 解析 SKILL.md 文件
 * 支持标准的 SKILL.md 格式
 */
export function parseSkillMd(content: string): ParsedSkill {
  const lines = content.split('\n')
  const metadata: SkillMetadata = {
    name: '',
    description: '',
  }

  let inFrontmatter = false
  let frontmatter = ''
  let skillContent = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测 frontmatter 开始
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      } else {
        // frontmatter 结束
        inFrontmatter = false
        parseFrontmatter(frontmatter, metadata)
        // 剩余内容是 skill 内容
        skillContent = lines.slice(i + 1).join('\n')
        break
      }
    }

    if (inFrontmatter) {
      frontmatter += line + '\n'
    }
  }

  // 如果没有 frontmatter，尝试从内容中提取信息
  if (!metadata.name || !metadata.description) {
    extractMetadataFromContent(content, metadata)
    skillContent = content
  }

  return {
    metadata,
    content: skillContent,
  }
}

/**
 * 解析 YAML frontmatter
 */
function parseFrontmatter(frontmatter: string, metadata: SkillMetadata) {
  const lines = frontmatter.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()

    switch (key) {
      case 'name':
        metadata.name = value.replace(/['"]/g, '')
        break
      case 'description':
        metadata.description = value.replace(/['"]/g, '')
        break
      case 'author':
        metadata.author = value.replace(/['"]/g, '')
        break
      case 'version':
        metadata.version = value.replace(/['"]/g, '')
        break
      case 'tags':
        metadata.tags = parseArray(value)
        break
      case 'trigger':
        metadata.trigger = parseArray(value)
        break
      case 'categories':
        metadata.categories = parseArray(value)
        break
    }
  }
}

/**
 * 解析数组值 (YAML 格式)
 */
function parseArray(value: string): string[] {
  // 移除方括号并分割
  const cleaned = value.replace(/^\[|\]$/g, '').trim()
  if (!cleaned) return []
  return cleaned.split(',').map((item) => item.trim().replace(/['"]/g, ''))
}

/**
 * 从内容中提取元数据（备用方案）
 */
function extractMetadataFromContent(content: string, metadata: SkillMetadata) {
  const lines = content.split('\n')

  for (const line of lines) {
    // 提取名称 (通常在标题中)
    const titleMatch = line.match(/^#\s+(.+)$/)
    if (titleMatch && !metadata.name) {
      metadata.name = titleMatch[1].trim()
      continue
    }

    // 提取描述
    const descMatch = line.match(/(?:description|描述)[:：]\s*(.+)$/i)
    if (descMatch && !metadata.description) {
      metadata.description = descMatch[1].trim()
      continue
    }

    // 提取作者
    const authorMatch = line.match(/(?:author|作者)[:：]\s*(.+)$/i)
    if (authorMatch && !metadata.author) {
      metadata.author = authorMatch[1].trim()
    }

    // 如果已经提取到基本信息，可以提前退出
    if (metadata.name && metadata.description) {
      break
    }
  }
}

/**
 * 解析 marketplace.json 文件
 */
export function parseMarketplaceJson(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse marketplace.json:', error)
    return null
  }
}

/**
 * 提取 install command
 * @param repository 仓库路径，如 "anthropics/skills"
 * @param subdirectory 可选的子目录，如 "algorithmic-art"
 */
export function extractInstallCommand(repository: string, subdirectory?: string): string {
  if (subdirectory) {
    // 多技能仓库，指定子目录
    // 例如: "anthropics/skills" + "algorithmic-art" -> "npx skills add anthropics/skills --skill=algorithmic-art"
    return `npx skills add ${repository} --skill=${subdirectory}`
  }
  // 单技能仓库
  // 例如: "anthropics/skills" -> "npx skills add anthropics/skills"
  return `npx skills add ${repository}`
}

/**
 * 生成 slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 验证 SKILL.md 格式
 */
export function validateSkillMd(parsedSkill: ParsedSkill): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!parsedSkill.metadata.name) {
    errors.push('Missing required field: name')
  }

  if (!parsedSkill.metadata.description) {
    errors.push('Missing required field: description')
  }

  if (!parsedSkill.content || parsedSkill.content.trim().length < 50) {
    errors.push('Skill content is too short (minimum 50 characters)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
