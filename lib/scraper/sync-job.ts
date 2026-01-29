/**
 * Skills 同步任务
 * 定时从 GitHub 同步 Skills 数据
 */

import { prisma } from '@/lib/db'
import { githubApi } from '@/lib/github'
import {
  scrapeRepository,
  scrapeAwesomeList,
  searchSkillRepos,
} from './github-scraper'

/**
 * 同步配置
 *
 * 数据来源：
 * - https://github.com/anthropics/skills (官方)
 * - https://github.com/ComposioHQ/awesome-claude-skills (Awesome 列表)
 * - https://github.com/sickn33/antigravity-awesome-skills (Awesome 列表)
 * - https://github.com/JimLiu/baoyu-skills (社区)
 * - https://github.com/cexll/myclaude (社区)
 * - https://skills.sh/ (官方网站)
 */
const SYNC_CONFIG = {
  // 官方仓库
  officialRepos: [
    { owner: 'anthropics', repo: 'skills' },
  ],

  // Awesome 列表
  awesomeLists: [
    { owner: 'ComposioHQ', repo: 'awesome-claude-skills' },
    { owner: 'sickn33', repo: 'antigravity-awesome-skills' },
  ],

  // 社区技能仓库
  communityRepos: [
    { owner: 'JimLiu', repo: 'baoyu-skills' },
    { owner: 'cexll', repo: 'myclaude' },
  ],

  // 搜索查询
  searchQueries: [
    'SKILL.md language:JavaScript stars:>10',
    'SKILL.md language:TypeScript stars:>10',
    'SKILL.md language:Python stars:>10',
  ],
}

/**
 * 执行完整的同步任务
 */
export async function runSyncJob() {
  const startTime = Date.now()
  console.log('🚀 Starting Skills sync job...\n')

  // 按来源统计
  const sourceStats = new Map<string, { added: number; updated: number; skipped: number; failed: number }>()

  try {
    // 1. 同步官方仓库
    console.log('📦 Syncing official repositories...')
    for (const repo of SYNC_CONFIG.officialRepos) {
      const source = `${repo.owner}/${repo.repo}`
      if (!sourceStats.has(source)) sourceStats.set(source, { added: 0, updated: 0, skipped: 0, failed: 0 })

      const result = await syncRepository(repo.owner, repo.repo, source)
      const stats = sourceStats.get(source)!

      if (result === 'added') stats.added++
      else if (result === 'updated') stats.updated++
      else stats.skipped++
    }

    // 2. 同步 Awesome 列表
    console.log('📋 Syncing awesome lists...')
    for (const list of SYNC_CONFIG.awesomeLists) {
      const source = `${list.owner}/${list.repo}`
      if (!sourceStats.has(source)) sourceStats.set(source, { added: 0, updated: 0, skipped: 0, failed: 0 })

      const skills = await scrapeAwesomeList(list.owner, list.repo)
      for (const skill of skills) {
        const result = await upsertSkill(skill)
        const stats = sourceStats.get(source)!
        if (result === 'added') stats.added++
        else stats.updated++
      }
    }

    // 3. 同步社区仓库
    console.log('👥 Syncing community repositories...')
    for (const repo of SYNC_CONFIG.communityRepos) {
      const source = `${repo.owner}/${repo.repo}`
      if (!sourceStats.has(source)) sourceStats.set(source, { added: 0, updated: 0, skipped: 0, failed: 0 })

      const result = await syncRepository(repo.owner, repo.repo, source)
      const stats = sourceStats.get(source)!

      if (result === 'added') stats.added++
      else if (result === 'updated') stats.updated++
      else stats.skipped++
    }

    // 4. 搜索新的 Skills
    console.log('🔍 Searching GitHub for new Skills...')
    const searchSource = 'GitHub Search'
    if (!sourceStats.has(searchSource)) sourceStats.set(searchSource, { added: 0, updated: 0, skipped: 0, failed: 0 })

    for (const query of SYNC_CONFIG.searchQueries) {
      const repos = await searchSkillRepos(query, 50)
      for (const repo of repos) {
        const result = await syncRepository(repo.owner, repo.repo, searchSource)
        const stats = sourceStats.get(searchSource)!
        if (result === 'added') stats.added++
        else if (result === 'updated') stats.updated++
        else stats.skipped++
      }
    }

    // 5. 更新已存在的 Skills
    console.log('↻ Updating existing Skills statistics...')
    const updatedStats = await updateExistingSkills()

    // 计算执行时间
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // 输出统计结果
    console.log('\n' + '═'.repeat(60))
    console.log('📊 SYNC RESULTS')
    console.log('═'.repeat(60))

    let totalAdded = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let totalFailed = 0

    for (const [source, stats] of sourceStats.entries()) {
      totalAdded += stats.added
      totalUpdated += stats.updated
      totalSkipped += stats.skipped
      totalFailed += stats.failed

      const hasChanges = stats.added > 0 || stats.updated > 0 || stats.skipped > 0
      if (hasChanges) {
        console.log(`\n📍 ${source}`)
        if (stats.added > 0) console.log(`   ✨ Added:    ${stats.added}`)
        if (stats.updated > 0) console.log(`   ↻ Updated:  ${stats.updated}`)
        if (stats.skipped > 0) console.log(`   ⊘ Skipped:  ${stats.skipped}`)
        if (stats.failed > 0) console.log(`   ❌ Failed:   ${stats.failed}`)
      }
    }

    // 数据库统计
    const dbStats = await getDatabaseStats()

    console.log('\n' + '─'.repeat(60))
    console.log('📈 SUMMARY')
    console.log('─'.repeat(60))
    console.log(`   ✨ New Skills:     ${totalAdded}`)
    console.log(`   ↻ Updated Skills:  ${totalUpdated}`)
    console.log(`   ⊘ Skipped:         ${totalSkipped}`)
    console.log(`   ↻ Stats Updated:   ${updatedStats}`)
    console.log(`   ⏱ Duration:        ${duration}s`)
    console.log('\n' + '─'.repeat(60))
    console.log('💾 DATABASE')
    console.log('─'.repeat(60))
    console.log(`   Total Skills:      ${dbStats.total}`)
    console.log(`   Active Skills:     ${dbStats.active}`)
    console.log(`   Official Skills:   ${dbStats.official}`)
    console.log(`   Featured Skills:   ${dbStats.featured}`)
    console.log('═'.repeat(60) + '\n')

    return { added: totalAdded, updated: totalUpdated }
  } catch (error) {
    console.error('\n❌ Sync job failed:', error)
    throw error
  }
}

/**
 * 同步单个仓库
 */
async function syncRepository(
  owner: string,
  repo: string,
  source?: string
): Promise<'added' | 'updated' | null> {
  try {
    const skillData = await scrapeRepository(owner, repo)
    if (!skillData) {
      return null
    }

    return await upsertSkill(skillData)
  } catch (error) {
    if (source) {
      console.error(`  ❌ Failed to sync ${owner}/${repo} from ${source}`)
    } else {
      console.error(`Failed to sync ${owner}/${repo}:`, error)
    }
    return null
  }
}

/**
 * 插入或更新 Skill
 */
async function upsertSkill(skillData: any): Promise<'added' | 'updated'> {
  const existing = await prisma.skill.findUnique({
    where: { slug: skillData.slug },
  })

  if (existing) {
    // 更新
    await prisma.skill.update({
      where: { id: existing.id },
      data: {
        ...skillData,
        id: existing.id, // 保持原 ID
        syncedAt: new Date(),
      },
    })
    return 'updated'
  } else {
    // 新增
    await prisma.skill.create({
      data: {
        ...skillData,
        syncedAt: new Date(),
      },
    })
    return 'added'
  }
}

/**
 * 更新已存在的 Skills
 * 更新 star 数、fork 数等统计数据
 */
async function updateExistingSkills(): Promise<number> {
  const skills = await prisma.skill.findMany({
    where: {
      isActive: true,
      syncedAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 超过 24 小时未更新
      },
    },
    take: 100, // 每次更新 100 个
  })

  let updated = 0
  for (const skill of skills) {
    try {
      const [owner, repo] = skill.repository.split('/')
      const repoData = await githubApi.getRepository(owner, repo)

      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          lastCommit: new Date(repoData.pushed_at),
          syncedAt: new Date(),
        },
      })
      updated++
    } catch (error) {
      // 静默失败，不输出日志
    }
  }
  return updated
}

/**
 * 获取数据库统计信息
 */
async function getDatabaseStats() {
  const [total, active, official, featured] = await Promise.all([
    prisma.skill.count(),
    prisma.skill.count({ where: { isActive: true } }),
    prisma.skill.count({ where: { isOfficial: true } }),
    prisma.skill.count({ where: { featured: true } }),
  ])

  return { total, active, official, featured }
}

/**
 * 命令行入口
 */
if (require.main === module) {
  runSyncJob()
    .then(() => {
      console.log('Sync job completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Sync job failed:', error)
      process.exit(1)
    })
}
