/**
 * Skills 同步任务
 * 定时从 GitHub 同步 Skills 数据
 */

import { prisma } from '../db'
import { githubApi } from '../github/index'
import {
  scrapeRepository,
  scrapeMultiSkillRepository,
  scrapeAwesomeList,
  searchSkillRepos,
} from './github-scraper'

/**
 * 同步配置
 */
const SYNC_CONFIG = {
  // 官方多技能仓库（从 skills/ 目录爬取所有技能）
  multiSkillRepos: [
    { owner: 'anthropics', repo: 'skills' },
  ],

  // 官方单技能仓库
  officialRepos: [
    // 单个技能的仓库
  ],

  // Awesome 列表
  awesomeLists: [
    { owner: 'ComposioHQ', repo: 'awesome-claude-skills' },
    { owner: 'sickn33', repo: 'antigravity-awesome-skills' },
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
  console.log('Starting Skills sync job...')

  const stats = {
    added: 0,
    updated: 0,
    failed: 0,
  }

  try {
    // 1. 同步官方多技能仓库
    console.log('Syncing official multi-skill repositories...')
    for (const repo of SYNC_CONFIG.multiSkillRepos) {
      const { skills, stats: scrapeStats } = await scrapeMultiSkillRepository(repo.owner, repo.repo, { verbose: true })
      for (const skill of skills) {
        const result = await upsertSkill(skill)
        stats[result] = (stats[result] || 0) + 1
      }
      console.log(`  ${repo.owner}/${repo.repo}: ${scrapeStats.success} skills found, ${scrapeStats.failed} failed`)
    }

    // 2. 同步官方单技能仓库
    console.log('Syncing official single-skill repositories...')
    for (const repo of SYNC_CONFIG.officialRepos) {
      const result = await syncRepository(repo.owner, repo.repo)
      if (result) {
        stats[result] = (stats[result] || 0) + 1
      }
    }

    // 3. 同步 Awesome 列表
    console.log('Syncing awesome lists...')
    for (const list of SYNC_CONFIG.awesomeLists) {
      const { skills, stats: scrapeStats } = await scrapeAwesomeList(list.owner, list.repo, { verbose: false })
      for (const skill of skills) {
        const result = await upsertSkill(skill)
        stats[result] = (stats[result] || 0) + 1
      }
      console.log(`  ${list.owner}/${list.repo}: ${scrapeStats.success} skills found, ${scrapeStats.failed} failed`)
    }

    // 3. 搜索新的 Skills
    console.log('Searching for new Skills...')
    for (const query of SYNC_CONFIG.searchQueries) {
      const repos = await searchSkillRepos(query, 50)
      for (const repo of repos) {
        const result = await syncRepository(repo.owner, repo.repo)
        if (result) {
          stats[result] = (stats[result] || 0) + 1
        }
      }
    }

    // 4. 更新已存在的 Skills
    console.log('Updating existing Skills...')
    await updateExistingSkills()

    console.log('Sync job completed:', stats)
    return stats
  } catch (error) {
    console.error('Sync job failed:', error)
    throw error
  }
}

/**
 * 同步单个仓库
 */
async function syncRepository(
  owner: string,
  repo: string
): Promise<'added' | 'updated' | null> {
  try {
    const skillData = await scrapeRepository(owner, repo)
    if (!skillData) {
      return null
    }

    return await upsertSkill(skillData)
  } catch (error) {
    console.error(`Failed to sync ${owner}/${repo}:`, error)
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

  // 清理数据，移除不能直接设置的关联字段
  const { categories, tags, ...cleanData } = skillData

  if (existing) {
    // 更新
    await prisma.skill.update({
      where: { id: existing.id },
      data: {
        ...cleanData,
        id: existing.id, // 保持原 ID
        syncedAt: new Date(),
      },
    })
    return 'updated'
  } else {
    // 新增
    await prisma.skill.create({
      data: {
        ...cleanData,
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
async function updateExistingSkills() {
  const skills = await prisma.skill.findMany({
    where: {
      isActive: true,
      syncedAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 超过 24 小时未更新
      },
    },
    take: 100, // 每次更新 100 个
  })

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
    } catch (error) {
      console.error(`Failed to update skill ${skill.slug}:`, error)
    }
  }
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
