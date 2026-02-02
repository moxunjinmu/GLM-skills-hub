/**
 * 手动同步翻译脚本
 * 用于批量翻译现有技能的 SKILL.md 和 README 内容
 *
 * 使用方法:
 * npm run sync:translations
 *
 * 环境变量:
 * ZHIPU_API_KEY - 智谱清言 API 密钥（必需）
 */

import { prisma } from '@/lib/db'
import { translateMarkdownContent } from '@/lib/translator/zhipu-translator'

/**
 * 翻译统计信息
 */
interface SyncStats {
  total: number
  skillMdTranslated: number
  readmeTranslated: number
  skipped: number
  failed: number
}

/**
 * 检查是否需要翻译
 */
function needsTranslation(content: string, contentZh: string | null): boolean {
  if (!content || content.length < 50) {
    return false
  }
  if (contentZh && contentZh.length > 50) {
    return false
  }
  return true
}

/**
 * 翻译单个技能
 */
async function translateSkill(
  skillId: string,
  skillName: string,
  skillMdContent: string | null,
  readmeContent: string | null,
  skillMdContentZh: string | null,
  readmeContentZh: string | null
): Promise<{ skillMdZh: string | null; readmeZh: string | null }> {
  const results = {
    skillMdZh: skillMdContentZh,
    readmeZh: readmeContentZh,
  }

  // 翻译 SKILL.md
  if (needsTranslation(skillMdContent || '', skillMdContentZh)) {
    try {
      console.log(`  📄 翻译 SKILL.md...`)
      const translated = await translateMarkdownContent(skillMdContent!, skillName)
      if (translated) {
        results.skillMdZh = translated
        console.log(`    ✓ SKILL.md 翻译完成`)
      }
      // 添加延迟避免速率限制
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.warn(`    ⚠ SKILL.md 翻译失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    if (skillMdContentZh) {
      console.log(`  ⊙ SKILL.md 已有翻译，跳过`)
    } else {
      console.log(`  ⊙ SKILL.md 内容为空，跳过`)
    }
  }

  // 翻译 README
  if (needsTranslation(readmeContent || '', readmeContentZh)) {
    try {
      console.log(`  📄 翻译 README.md...`)
      const translated = await translateMarkdownContent(readmeContent!, skillName)
      if (translated) {
        results.readmeZh = translated
        console.log(`    ✓ README.md 翻译完成`)
      }
      // 添加延迟避免速率限制
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.warn(`    ⚠ README.md 翻译失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    if (readmeContentZh) {
      console.log(`  ⊙ README 已有翻译，跳过`)
    } else {
      console.log(`  ⊙ README 内容为空，跳过`)
    }
  }

  return results
}

/**
 * 批量同步翻译
 */
async function syncTranslations(options: {
  limit?: number
  skillId?: string
  force?: boolean
}): Promise<SyncStats> {
  const { limit, skillId, force = false } = options

  const stats: SyncStats = {
    total: 0,
    skillMdTranslated: 0,
    readmeTranslated: 0,
    skipped: 0,
    failed: 0,
  }

  try {
    // 构建查询条件
    const where: any = {
      isActive: true,
    }

    if (skillId) {
      where.id = skillId
    }

    // 如果不是强制翻译，只查询需要翻译的技能
    if (!force) {
      where.OR = [
        { skillMdContentZh: null },
        { readmeContentZh: null },
      ]
    }

    // 获取需要翻译的技能
    const skills = await prisma.skill.findMany({
      where,
      take: limit || undefined,
      orderBy: { stars: 'desc' },
    })

    stats.total = skills.length

    if (stats.total === 0) {
      console.log(`\n✅ 没有需要翻译的技能`)
      return stats
    }

    console.log(`\n🚀 开始翻译 ${stats.total} 个技能...\n`)

    // 逐个翻译
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]
      const progress = `[${i + 1}/${stats.total}]`

      console.log(`\n${progress} ${skill.nameZh || skill.name}`)
      console.log(`   仓库: ${skill.repository}`)

      try {
        const results = await translateSkill(
          skill.id,
          skill.name,
          skill.skillMdContent,
          skill.readmeContent,
          skill.skillMdContentZh,
          skill.readmeContentZh
        )

        // 更新数据库
        const shouldUpdate =
          results.skillMdZh !== skill.skillMdContentZh ||
          results.readmeZh !== skill.readmeContentZh

        if (shouldUpdate) {
          await prisma.skill.update({
            where: { id: skill.id },
            data: {
              skillMdContentZh: results.skillMdZh,
              readmeContentZh: results.readmeZh,
            },
          })

          if (results.skillMdZh && results.skillMdZh !== skill.skillMdContentZh) {
            stats.skillMdTranslated++
          }
          if (results.readmeZh && results.readmeZh !== skill.readmeContentZh) {
            stats.readmeTranslated++
          }

          console.log(`  💾 已保存到数据库`)
        } else {
          stats.skipped++
        }
      } catch (error) {
        console.error(`  ❌ 翻译失败: ${error instanceof Error ? error.message : String(error)}`)
        stats.failed++
      }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`📊 翻译统计`)
    console.log(`${'='.repeat(50)}`)
    console.log(`总技能数:      ${stats.total}`)
    console.log(`SKILL.md:      ${stats.skillMdTranslated} 个已翻译`)
    console.log(`README:        ${stats.readmeTranslated} 个已翻译`)
    console.log(`跳过:          ${stats.skipped}`)
    console.log(`失败:          ${stats.failed}`)
    console.log(`${'='.repeat(50)}`)

    return stats
  } catch (error) {
    console.error('同步翻译失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)

  // 解析命令行参数
  const options: {
    limit?: number
    skillId?: string
    force?: boolean
  } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[i + 1], 10)
      i++
    } else if (arg === '--skill' && i + 1 < args.length) {
      options.skillId = args[i + 1]
      i++
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
手动同步翻译脚本

用法:
  npm run sync:translations [选项]

选项:
  --limit <数量>      限制翻译的技能数量
  --skill <ID>        只翻译指定 ID 的技能
  --force             强制重新翻译已有翻译的内容
  --help, -h          显示帮助信息

示例:
  npm run sync:translations              # 翻译所有未翻译的技能
  npm run sync:translations --limit 10   # 只翻译前 10 个技能
  npm run sync:translations --skill xxx  # 只翻译指定技能
  npm run sync:translations --force      # 强制重新翻译所有技能
`)
      process.exit(0)
    }
  }

  // 检查 API 密钥
  if (!process.env.ZHIPU_API_KEY) {
    console.error('❌ 错误: 未设置 ZHIPU_API_KEY 环境变量')
    console.error('请在 .env.local 中设置: ZHIPU_API_KEY=your_api_key')
    process.exit(1)
  }

  await syncTranslations(options)
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

export { syncTranslations }
