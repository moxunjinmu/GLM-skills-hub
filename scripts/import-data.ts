/**
 * 数据导入脚本
 * 将导出的数据导入到数据库
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * 导入完整数据
 */
async function importData(filePath: string) {
  console.log('开始导入数据...')

  // 读取导出的数据
  const jsonContent = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(jsonContent)

  let stats = {
    categories: 0,
    tags: 0,
    skills: 0,
  }

  try {
    // 1. 导入分类
    console.log('导入分类...')
    for (const category of data.categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          nameZh: category.nameZh,
          icon: category.icon,
          color: category.color,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
        },
        create: {
          id: category.id,
          name: category.name,
          nameZh: category.nameZh,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
        },
      })
      stats.categories++
    }
    console.log(`✅ ${stats.categories} 个分类`)

    // 2. 导入标签
    console.log('导入标签...')
    for (const tag of data.tags) {
      await prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {
          name: tag.name,
          nameZh: tag.nameZh,
          type: tag.type,
        },
        create: {
          id: tag.id,
          name: tag.name,
          nameZh: tag.nameZh,
          slug: tag.slug,
          type: tag.type,
        },
      })
      stats.tags++
    }
    console.log(`✅ ${stats.tags} 个标签`)

    // 3. 导入 Skills
    console.log('导入 Skills...')
    for (const skill of data.skills) {
      // 提取关联数据
      const { categories, tags, ...skillData } = skill

      await prisma.skill.upsert({
        where: { slug: skillData.slug },
        update: {
          name: skillData.name,
          nameZh: skillData.nameZh,
          description: skillData.description,
          descriptionZh: skillData.descriptionZh,
          repository: skillData.repository,
          author: skillData.author,
          stars: skillData.stars,
          forks: skillData.forks,
          openIssues: skillData.openIssues,
          lastCommit: skillData.lastCommit,
          imageUrl: skillData.imageUrl,
          isOfficial: skillData.isOfficial,
          featured: skillData.featured,
          isActive: skillData.isActive,
          usageCount: skillData.usageCount,
          viewCount: skillData.viewCount,
          rating: skillData.rating,
          ratingCount: skillData.ratingCount,
          syncedAt: skillData.syncedAt,
        },
        create: {
          id: skillData.id,
          name: skillData.name,
          nameZh: skillData.nameZh,
          slug: skillData.slug,
          description: skillData.description,
          descriptionZh: skillData.descriptionZh,
          repository: skillData.repository,
          author: skillData.author,
          stars: skillData.stars,
          forks: skillData.forks,
          openIssues: skillData.openIssues,
          lastCommit: skillData.lastCommit,
          imageUrl: skillData.imageUrl,
          isOfficial: skillData.isOfficial,
          featured: skillData.featured,
          isActive: skillData.isActive,
          usageCount: skillData.usageCount || 0,
          viewCount: skillData.viewCount || 0,
          rating: skillData.rating || 0,
          ratingCount: skillData.ratingCount || 0,
          syncedAt: skillData.syncedAt,
        },
      })

      // 关联分类
      if (categories && categories.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM "_SkillCategories" WHERE "B" = ${skill.id}
        `
        for (const category of categories) {
          await prisma.$executeRaw`
            INSERT INTO "_SkillCategories" ("A", "B") VALUES (${category.id}, ${skill.id})
            ON CONFLICT ("A", "B") DO NOTHING
          `
        }
      }

      // 关联标签
      if (tags && tags.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM "_SkillTags" WHERE "B" = ${skill.id}
        `
        for (const tag of tags) {
          await prisma.$executeRaw`
            INSERT INTO "_SkillTags" ("A", "B") VALUES (${tag.id}, ${skill.id})
            ON CONFLICT ("A", "B") DO NOTHING
          `
        }
      }

      stats.skills++
      if (stats.skills % 50 === 0) {
        console.log(`   进度: ${stats.skills}/${data.skills.length}`)
      }
    }
    console.log(`✅ ${stats.skills} 个技能`)

    console.log('\n导入完成！')
    console.log(`- 分类: ${stats.categories}`)
    console.log(`- 标签: ${stats.tags}`)
    console.log(`- 技能: ${stats.skills}`)
  } catch (error) {
    console.error('导入失败:', error)
    throw error
  }
}

// 命令行入口
if (require.main === module) {
  const filePath = process.argv[2] || 'data-export.json'

  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`)
    console.log('\n使用方法:')
    console.log('  npx tsx scripts/import-data.ts [文件路径]')
    console.log('\n示例:')
    console.log('  npx tsx scripts/import-data.ts data-export.json')
    process.exit(1)
  }

  importData(filePath)
    .then(() => {
      console.log('\n✅ 导入成功！')
      process.exit(0)
    })
    .catch((err) => {
      console.error('\n❌ 导入失败:', err)
      process.exit(1)
    })
}
