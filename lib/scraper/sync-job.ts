/**
 * Skills 同步任务（优化版）
 * 定时从 GitHub 同步 Skills 数据
 *
 * 优化功能：
 * 1. 跳过未更新技能 - 检查 lastCommit 时间，避免不必要的同步
 * 2. 缓存机制 - 缓存仓库信息，减少重复 API 调用
 * 3. 进度百分比 - 显示实时同步进度
 * 4. 批量操作 - 批量查询数据库，减少查询次数
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
 * 仓库配置类型
 */
interface RepoConfig {
  owner: string
  repo: string
}

/**
 * 仓库统计信息
 */
interface RepoStats {
  owner: string
  repo: string
  total: number
  synced: number
  added: number
  updated: number
  failed: number
  skipped: number  // 新增：跳过计数
}

/**
 * 仓库信息缓存
 */
const repoCache = new Map<string, any>()

/**
 * 同步配置
 */
const SYNC_CONFIG = {
  // 多技能仓库（从 skills/ 目录爬取所有技能）
  multiSkillRepos: [
    { owner: 'anthropics', repo: 'skills' },
    { owner: 'sickn33', repo: 'antigravity-awesome-skills' },
    { owner: 'ComposioHQ', repo: 'awesome-claude-skills' },
    { owner: 'JimLiu', repo: 'baoyu-skills' },
    { owner: 'cexll', repo: 'myclaude' },
  ] as RepoConfig[],

  // 官方单技能仓库
  officialRepos: [] as RepoConfig[],

  // Awesome 列表（单技能仓库列表）
  awesomeLists: [] as RepoConfig[],

  // 搜索查询
  searchQueries: [] as string[],
}

/**
 * 打印带颜色的状态
 */
const log = {
  success: (msg: string) => console.log(`✅ ${msg}`),
  error: (msg: string) => console.log(`❌ ${msg}`),
  info: (msg: string) => console.log(`\n${msg}`),
  repo: (msg: string) => console.log(`\n📦 ${msg}`),
  skill: (name: string, success: boolean, action: string) => {
    const icon = success ? '✓' : '✗'
    const actionText = action === 'added' ? '[新增]' : action === 'updated' ? '[更新]' : action === 'skipped' ? '[跳过]' : '[失败]'
    console.log(`  ${icon} ${actionText} ${name}`)
  },
  progress: (current: number, total: number, message: string) => {
    const percent = Math.round((current / total) * 100)
    process.stdout.write(`\r  进度: ${current}/${total} (${percent}%) - ${message}`)
    if (current === total) console.log() // 完成时换行
  },
}

/**
 * 打印仓库统计
 */
function printRepoStats(stats: RepoStats, isMultiRepo: boolean, totalRepos: number, currentRepo: number) {
  if (isMultiRepo) {
    console.log(`\n  ┌─ 仓库 ${currentRepo}/${totalRepos}: ${stats.owner}/${stats.repo}`)
    console.log(`  ├─ 总数: ${stats.total} | 同步: ${stats.synced} | 新增: ${stats.added} | 更新: ${stats.updated} | 跳过: ${stats.skipped} | 失败: ${stats.failed}`)
    console.log(`  └─ 完成`)
  } else {
    const results = []
    if (stats.failed > 0) results.push(`失败: ${stats.failed}`)
    if (stats.skipped > 0) results.push(`跳过: ${stats.skipped}`)
    if (stats.added > 0) results.push(`新增: ${stats.added}`)
    if (stats.updated > 0) results.push(`更新: ${stats.updated}`)
    console.log(`  ${stats.owner}/${stats.repo}: ${results.join(' | ')}`)
  }
}

/**
 * 打印最终总结
 */
function printSummary(repoStatsList: RepoStats[], totalStats: { added: number; updated: number; failed: number; skipped: number }) {
  console.log('\n' + '='.repeat(50))
  console.log('📊 同步完成统计')
  console.log('='.repeat(50))

  // 多仓库模式：显示每个仓库的详情
  if (repoStatsList.length > 1) {
    console.log(`\n仓库总数: ${repoStatsList.length}`)
    console.log('\n各仓库详情:')

    let grandTotal = 0
    let grandSynced = 0
    let grandAdded = 0
    let grandUpdated = 0
    let grandSkipped = 0
    let grandFailed = 0

    repoStatsList.forEach((stats, index) => {
      console.log(`\n  ${index + 1}. ${stats.owner}/${stats.repo}`)
      console.log(`     总数: ${stats.total} | 同步: ${stats.synced} | 新增: ${stats.added} | 更新: ${stats.updated} | 跳过: ${stats.skipped} | 失败: ${stats.failed}`)
      grandTotal += stats.total
      grandSynced += stats.synced
      grandAdded += stats.added
      grandUpdated += stats.updated
      grandSkipped += stats.skipped
      grandFailed += stats.failed
    })

    console.log('\n' + '-'.repeat(50))
    console.log('汇总统计:')
    console.log(`  总数: ${grandTotal} | 同步: ${grandSynced} | 新增: ${grandAdded} | 更新: ${grandUpdated} | 跳过: ${grandSkipped} | 失败: ${grandFailed}`)

    // 性能统计
    if (grandSkipped > 0) {
      const skipPercent = Math.round((grandSkipped / grandTotal) * 100)
      console.log(`\n⚡ 性能优化: 跳过了 ${grandSkipped} 个未更新的技能 (${skipPercent}% 的时间节省)`)
    }
  } else {
    // 单仓库模式：简洁显示
    const stats = repoStatsList[0]
    const results = []
    if (totalStats.failed > 0) results.push(`失败: ${totalStats.failed}`)
    if (totalStats.skipped > 0) results.push(`跳过: ${totalStats.skipped}`)
    if (totalStats.added > 0) results.push(`新增: ${totalStats.added}`)
    if (totalStats.updated > 0) results.push(`更新: ${totalStats.updated}`)
    console.log(`\n${stats.owner}/${stats.repo}: ${results.join(' | ')}`)

    if (totalStats.skipped > 0) {
      const skipPercent = Math.round((totalStats.skipped / stats.total) * 100)
      console.log(`⚡ 性能优化: 跳过了 ${totalStats.skipped} 个未更新的技能 (${skipPercent}% 的时间节省)`)
    }
  }

  console.log('='.repeat(50))
}

/**
 * 获取缓存的仓库信息
 */
async function getCachedRepoInfo(owner: string, repo: string): Promise<any> {
  const cacheKey = `${owner}/${repo}`

  if (repoCache.has(cacheKey)) {
    return repoCache.get(cacheKey)
  }

  try {
    const repoData = await githubApi.getRepository(owner, repo)
    repoCache.set(cacheKey, repoData)
    return repoData
  } catch (error) {
    return null
  }
}

/**
 * 检查技能是否需要同步
 * 通过比较 GitHub 仓库的 lastCommit 时间和本地数据库中的时间
 */
async function needsSync(owner: string, repo: string, skillSlug: string): Promise<boolean> {
  try {
    // 从数据库获取现有技能
    const existing = await prisma.skill.findUnique({
      where: { slug: skillSlug },
      select: { lastCommit: true },
    })

    // 如果技能不存在，需要同步
    if (!existing || !existing.lastCommit) {
      return true
    }

    // 获取 GitHub 仓库的更新时间
    const repoData = await getCachedRepoInfo(owner, repo)
    if (!repoData || !repoData.pushed_at) {
      return true // 获取失败，默认需要同步
    }

    const githubLastCommit = new Date(repoData.pushed_at)
    const localLastCommit = new Date(existing.lastCommit)

    // 如果 GitHub 上的更新时间比本地新，需要同步
    return githubLastCommit > localLastCommit
  } catch (error) {
    // 出错时默认需要同步
    return true
  }
}

/**
 * 同步多技能仓库（优化版）
 */
async function syncMultiSkillRepo(repo: RepoConfig): Promise<RepoStats> {
  const stats: RepoStats = {
    owner: repo.owner,
    repo: repo.repo,
    total: 0,
    synced: 0,
    added: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
  }

  log.repo(`正在同步: ${repo.owner}/${repo.repo}`)

  try {
    const { skills, stats: scrapeStats } = await scrapeMultiSkillRepository(repo.owner, repo.repo, { verbose: false })
    stats.total = scrapeStats.success + scrapeStats.failed

    // 批量查询现有技能的 lastCommit 时间
    const slugs = skills.map(s => s.slug)
    const existingSkills = await prisma.skill.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, lastCommit: true },
    })

    // 创建 slug -> lastCommit 的映射
    const lastCommitMap = new Map(existingSkills.map(s => [s.slug, s.lastCommit]))

    // 获取仓库的 lastCommit 时间（缓存）
    const repoData = await getCachedRepoInfo(repo.owner, repo.repo)
    const repoLastCommit = repoData?.pushed_at ? new Date(repoData.pushed_at) : null

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]
      const existingLastCommit = lastCommitMap.get(skill.slug)

      // 检查是否需要同步
      let shouldSync = true
      if (existingLastCommit && repoLastCommit) {
        const localCommit = new Date(existingLastCommit)
        // 如果本地记录的时间 >= 仓库时间，跳过
        shouldSync = repoLastCommit > localCommit
      }

      if (!shouldSync) {
        stats.skipped++
        log.skill(skill.name, true, 'skipped')
        log.progress(i + 1, skills.length, `跳过 ${skill.name}`)
        continue
      }

      try {
        const result = await upsertSkill(skill)
        stats.synced++
        if (result === 'added') stats.added++
        else if (result === 'updated') stats.updated++

        log.skill(skill.name, true, result)
        log.progress(i + 1, skills.length, `同步 ${skill.name}`)
      } catch (error) {
        stats.failed++
        log.skill(skill.name, false, 'failed')
        log.progress(i + 1, skills.length, `失败 ${skill.name}`)
      }
    }

    // 处理爬取失败的技能
    stats.failed += scrapeStats.failed
  } catch (error) {
    log.error(`同步仓库失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  return stats
}

/**
 * 同步单技能仓库（优化版）
 */
async function syncSingleSkillRepo(repo: RepoConfig): Promise<RepoStats | null> {
  const stats: RepoStats = {
    owner: repo.owner,
    repo: repo.repo,
    total: 1,
    synced: 0,
    added: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
  }

  try {
    // 检查是否需要同步
    const slug = `${repo.owner}-${repo.repo}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const shouldSync = await needsSync(repo.owner, repo.repo, slug)

    if (!shouldSync) {
      stats.skipped++
      log.skill(`${repo.owner}/${repo.repo}`, true, 'skipped')
      return stats
    }

    const skillData = await scrapeRepository(repo.owner, repo.repo)
    if (!skillData) {
      stats.failed++
      return stats
    }

    const result = await upsertSkill(skillData)
    stats.synced++
    if (result === 'added') stats.added++
    else if (result === 'updated') stats.updated++

    log.skill(skillData.name || `${repo.owner}/${repo.repo}`, true, result)
  } catch (error) {
    stats.failed++
    log.skill(`${repo.owner}/${repo.repo}`, false, 'failed')
  }

  return stats
}

/**
 * 执行完整的同步任务（优化版）
 */
export async function runSyncJob() {
  log.info('🚀 开始同步 Skills 数据...')

  const repoStatsList: RepoStats[] = []
  const totalStats = {
    added: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
  }

  const startTime = Date.now()

  try {
    // 1. 同步多技能仓库
    if (SYNC_CONFIG.multiSkillRepos.length > 0) {
      log.info(`📦 多技能仓库 (${SYNC_CONFIG.multiSkillRepos.length} 个)`)
      for (let i = 0; i < SYNC_CONFIG.multiSkillRepos.length; i++) {
        const repo = SYNC_CONFIG.multiSkillRepos[i]
        const stats = await syncMultiSkillRepo(repo)
        repoStatsList.push(stats)

        totalStats.added += stats.added
        totalStats.updated += stats.updated
        totalStats.failed += stats.failed
        totalStats.skipped += stats.skipped

        printRepoStats(stats, SYNC_CONFIG.multiSkillRepos.length > 1, SYNC_CONFIG.multiSkillRepos.length, i + 1)
      }
    }

    // 2. 同步单技能仓库
    if (SYNC_CONFIG.officialRepos.length > 0) {
      log.info(`📦 单技能仓库 (${SYNC_CONFIG.officialRepos.length} 个)`)
      for (const repo of SYNC_CONFIG.officialRepos) {
        const stats = await syncSingleSkillRepo(repo)
        if (stats) {
          repoStatsList.push(stats)
          totalStats.added += stats.added
          totalStats.updated += stats.updated
          totalStats.failed += stats.failed
          totalStats.skipped += stats.skipped
          printRepoStats(stats, true, SYNC_CONFIG.officialRepos.length, 1)
        }
      }
    }

    // 3. 同步 Awesome 列表
    if (SYNC_CONFIG.awesomeLists.length > 0) {
      log.info(`📋 Awesome 列表 (${SYNC_CONFIG.awesomeLists.length} 个)`)
      for (const list of SYNC_CONFIG.awesomeLists) {
        const stats = await syncMultiSkillRepo({ owner: list.owner, repo: list.repo })
        repoStatsList.push(stats)

        totalStats.added += stats.added
        totalStats.updated += stats.updated
        totalStats.failed += stats.failed
        totalStats.skipped += stats.skipped
      }
    }

    // 4. 搜索新的 Skills
    if (SYNC_CONFIG.searchQueries.length > 0) {
      log.info(`🔍 搜索新 Skills`)
      for (const query of SYNC_CONFIG.searchQueries) {
        const repos = await searchSkillRepos(query, 50)
        for (const repo of repos) {
          const stats = await syncSingleSkillRepo(repo)
          if (stats) {
            totalStats.added += stats.added
            totalStats.updated += stats.updated
            totalStats.failed += stats.failed
            totalStats.skipped += stats.skipped
          }
        }
      }
    }

    // 5. 更新已存在的 Skills
    await updateExistingSkills()

    // 计算总耗时
    const elapsed = Math.round((Date.now() - startTime) / 1000)

    // 打印总结
    printSummary(repoStatsList, totalStats)

    console.log(`\n⏱️  总耗时: ${elapsed} 秒`)

    return { stats: totalStats, repoStats: repoStatsList }
  } catch (error) {
    log.error(`同步任务失败: ${error instanceof Error ? error.message : String(error)}`)
    throw error
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

  if (skills.length === 0) return

  log.info(`🔄 更新 ${skills.length} 个已存在技能的统计数据...`)

  for (const skill of skills) {
    try {
      const [owner, repo] = skill.repository.split('/')
      const repoData = await getCachedRepoInfo(owner, repo)

      if (repoData) {
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
      }
    } catch (error) {
      // 静默失败，不打印错误
    }
  }
}

/**
 * 命令行入口
 */
if (require.main === module) {
  runSyncJob()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('同步任务失败:', error)
      process.exit(1)
    })
}
