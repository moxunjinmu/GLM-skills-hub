/**
 * 数据导出脚本
 * 将本地数据库数据导出为 JSON 文件
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * 导出所有数据
 */
async function exportData() {
  console.log('开始导出数据...')

  const data = {
    categories: await prisma.category.findMany(),
    tags: await prisma.tag.findMany(),
    skills: await prisma.skill.findMany({
      include: {
        categories: true,
        tags: true,
      },
    }),
  }

  // 保存到文件
  const outputPath = path.join(process.cwd(), 'data-export.json')
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

  console.log(`✅ 数据已导出到: ${outputPath}`)
  console.log(`   - ${data.categories.length} 个分类`)
  console.log(`   - ${data.tags.length} 个标签`)
  console.log(`   - ${data.skills.length} 个技能`)

  return data
}

/**
 * 仅导出 Skills 数据（不含关联）
 */
async function exportSkillsOnly() {
  console.log('开始导出 Skills 数据...')

  const skills = await prisma.skill.findMany()

  const outputPath = path.join(process.cwd(), 'skills-export.json')
  fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2))

  console.log(`✅ 已导出 ${skills.length} 个 Skills 到: ${outputPath}`)

  return skills
}

/**
 * 导出为 SQL INSERT 语句
 */
async function exportAsSQL() {
  console.log('开始导出 SQL...')

  const skills = await prisma.skill.findMany()

  const sqlStatements = skills.map((skill) => {
    const values = [
      skill.id,
      skill.name,
      skill.nameZh || null,
      skill.description,
      skill.descriptionZh || null,
      skill.repository,
      skill.author,
      skill.stars,
      skill.forks,
      skill.openIssues,
      skill.lastCommit?.toISOString() || null,
      skill.imageUrl || null,
      skill.isOfficial,
      skill.featured,
      skill.isActive,
      skill.usageCount,
      skill.viewCount,
      skill.rating,
      skill.ratingCount,
      skill.syncedAt?.toISOString() || null,
      skill.createdAt.toISOString(),
      skill.updatedAt.toISOString(),
    ].map((v) => (v === null ? 'NULL' : `'${v?.toString().replace(/'/g, "''")}'`))

    return `INSERT INTO skills (id, name, "nameZh", description, "descriptionZh", repository, author, stars, forks, "openIssues", "lastCommit", "imageUrl", "isOfficial", featured, "isActive", "usageCount", "viewCount", rating, "ratingCount", "syncedAt", "createdAt", "updatedAt") VALUES (${values.join(', ')});`
  })

  const outputPath = path.join(process.cwd(), 'skills-export.sql')
  fs.writeFileSync(outputPath, sqlStatements.join('\n'))

  console.log(`✅ 已导出 ${skills.length} 条 SQL 语句到: ${outputPath}`)
}

// 命令行入口
if (require.main === module) {
  const command = process.argv[2]

  switch (command) {
    case 'sql':
      exportAsSQL()
        .then(() => process.exit(0))
        .catch((err) => {
          console.error('导出失败:', err)
          process.exit(1)
        })
      break
    case 'skills':
      exportSkillsOnly()
        .then(() => process.exit(0))
        .catch((err) => {
          console.error('导出失败:', err)
          process.exit(1)
        })
      break
    default:
      exportData()
        .then(() => process.exit(0))
        .catch((err) => {
          console.error('导出失败:', err)
          process.exit(1)
        })
  }
}
