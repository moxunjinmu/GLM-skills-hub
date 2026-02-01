/**
 * GitHub 仓库爬虫
 * 用于发现和获取 Skills 仓库信息
 */

import { githubApi } from '../github/index'
import { parseSkillMd, extractInstallCommand, generateSlug } from './skill-parser'
import { SkillInput } from '../../types/index'
import { translateSkillData } from '../translator/zhipu-translator'

/**
 * 爬取统计信息
 */
interface ScrapeStats {
  total: number
  success: number
  failed: number
  skipped: number
  errors: Array<{ repo: string; error: string }>
}

/**
 * 爬取单个仓库
 */
export async function scrapeRepository(
  owner: string,
  repo: string,
  options: { verbose?: boolean } = {}
): Promise<SkillInput | null> {
  const { verbose = false } = options

  try {
    if (verbose) console.log(`[${owner}/${repo}] Starting scrape...`)

    // 获取仓库信息
    const repoData = await githubApi.getRepository(owner, repo)

    // 获取 README
    const readme = await githubApi.getReadme(owner, repo)

    // 查找 SKILL.md 文件
    const skillMdContent = await githubApi.getFileContent(owner, repo, 'SKILL.md')

    // 查找 marketplace.json
    const marketplaceJsonContent = await githubApi.getFileContent(
      owner,
      repo,
      'marketplace.json'
    )

    // 如果没有根目录的 SKILL.md，尝试从 skills/ 目录查找
    let finalSkillMdContent = skillMdContent
    if (!skillMdContent) {
      console.log(`  No SKILL.md in root, searching in skills/ directory...`)

      // 尝试在 skills/ 目录中查找 SKILL.md
      const skillMdPath = await githubApi.findFileInDirectory(
        owner,
        repo,
        'skills',
        'SKILL.md',
        2 // 最多递归 2 层
      )

      if (skillMdPath) {
        console.log(`  Found SKILL.md at: ${skillMdPath}`)
        finalSkillMdContent = await githubApi.getFileContent(owner, repo, skillMdPath)
      }
    }

    // 如果还没找到，尝试其他常见位置
    if (!finalSkillMdContent) {
      const commonPaths = [
        'skill.md',
        'docs/SKILL.md',
        'docs/skill.md',
        '.github/SKILL.md',
      ]

      for (const path of commonPaths) {
        const content = await githubApi.getFileContent(owner, repo, path)
        if (content) {
          console.log(`  Found SKILL.md at: ${path}`)
          finalSkillMdContent = content
          break
        }
      }
    }

    if (!finalSkillMdContent) {
      console.log(`No SKILL.md found in ${owner}/${repo}`)
      return null
    }

    // 解析 SKILL.md
    const parsedSkill = parseSkillMd(finalSkillMdContent)
    const marketplaceJson = marketplaceJsonContent
      ? JSON.parse(marketplaceJsonContent)
      : null

    // 自动翻译为中文
    let nameZh: string | null = null
    let descriptionZh: string | null = null

    try {
      console.log(`  🌐 正在翻译 ${parsedSkill.metadata.name}...`)
      const translations = await translateSkillData({
        name: parsedSkill.metadata.name,
        description: parsedSkill.metadata.description,
      })
      nameZh = translations.nameZh
      descriptionZh = translations.descriptionZh
      if (nameZh) console.log(`    ✓ 名称: ${nameZh}`)
      if (descriptionZh) console.log(`    ✓ 描述已翻译`)
    } catch (error) {
      // 翻译失败不影响主流程
      console.warn(`  ⚠ 翻译失败: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 构建 Skill 数据
    const slug = marketplaceJson?.id || generateSlug(parsedSkill.metadata.name)
    const installCommand = marketplaceJson?.installCommand || extractInstallCommand(`${owner}/${repo}`)

    const skillData: SkillInput = {
      name: parsedSkill.metadata.name,
      nameZh,
      slug,
      description: parsedSkill.metadata.description,
      descriptionZh,
      repository: `${owner}/${repo}`,
      author: owner,
      authorId: String(repoData.owner.id),
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastCommit: new Date(repoData.pushed_at),
      skillMdContent: finalSkillMdContent,
      readmeContent: readme,
      marketplaceJson,
      installCommand,
      isOfficial: owner === 'anthropics',
      isVerified: repoData.stargazers_count >= 100, // 星标超过100视为已验证
      isActive: true,
      featured: repoData.stargazers_count >= 1000, // 星标超过1000设为精选
      viewCount: 0,
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      categories: [],
      tags: [],
    }

    return skillData
  } catch (error) {
    console.error(`Failed to scrape repository ${owner}/${repo}:`, error)
    return null
  }
}

/**
 * 爬取多技能仓库（从 skills/ 目录或根目录遍历所有子目录）
 * 例如:
 * - anthropics/skills 有 skills/ 目录，包含多个独立的技能
 * - ComposioHQ/awesome-claude-skills 技能目录在根目录
 */
export async function scrapeMultiSkillRepository(
  owner: string,
  repo: string,
  options: { verbose?: boolean } = {}
): Promise<{ skills: SkillInput[]; stats: ScrapeStats }> {
  const { verbose = false } = options
  const skills: SkillInput[] = []
  const stats: ScrapeStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  try {
    if (verbose) console.log(`\n[Multi-Skill Repo] ${owner}/${repo}`)

    // 获取仓库信息
    const repoData = await githubApi.getRepository(owner, repo)
    const readme = await githubApi.getReadme(owner, repo)

    // 首先尝试列出 skills/ 目录内容
    let skillsDirItems = await githubApi.listDirectory(owner, repo, 'skills')
    let skillsBaseDir = 'skills'

    // 如果没有 skills/ 目录，尝试从根目录查找包含 skill.md 的子目录
    if (skillsDirItems.length === 0) {
      if (verbose) console.log(`  No skills/ directory, checking root for skill directories...`)

      const rootItems = await githubApi.listDirectory(owner, repo, '')
      // 筛选出可能是技能目录的子目录（包含 skill.md 文件）
      const potentialSkillDirs = rootItems.filter((item) => item.type === 'dir')

      skillsDirItems = []
      for (const dir of potentialSkillDirs) {
        // 检查是否包含 skill.md 或 SKILL.md
        const hasSkillMd = await githubApi.getFileContent(owner, repo, `${dir.name}/skill.md`) ||
                          await githubApi.getFileContent(owner, repo, `${dir.name}/SKILL.md`)
        if (hasSkillMd) {
          skillsDirItems.push(dir)
        }
      }
      skillsBaseDir = '' // 根目录模式
    }

    if (skillsDirItems.length === 0) {
      console.log(`No skill directories found in ${owner}/${repo}`)
      return { skills, stats }
    }

    // 筛选出子目录
    const subdirs = skillsDirItems.filter((item) => item.type === 'dir')
    stats.total = subdirs.length

    if (verbose) console.log(`Found ${subdirs.length} skill subdirectories (in ${skillsBaseDir || 'root'})`)

    // 遍历每个子目录
    for (const subdir of subdirs) {
      // 尝试 skill.md 和 SKILL.md
      const skillMdPath1 = skillsBaseDir ? `${skillsBaseDir}/${subdir.name}/skill.md` : `${subdir.name}/skill.md`
      const skillMdPath2 = skillsBaseDir ? `${skillsBaseDir}/${subdir.name}/SKILL.md` : `${subdir.name}/SKILL.md`

      try {
        // 优先尝试 skill.md（小写），然后尝试 SKILL.md（大写）
        let skillMdContent = await githubApi.getFileContent(owner, repo, skillMdPath1)
        let skillMdPath = skillMdPath1

        if (!skillMdContent) {
          skillMdContent = await githubApi.getFileContent(owner, repo, skillMdPath2)
          skillMdPath = skillMdPath2
        }

        if (!skillMdContent) {
          stats.failed++
          stats.errors.push({ repo: `${owner}/${repo}/${subdir.name}`, error: 'No skill.md found' })
          if (verbose) console.log(`  ✗ ${subdir.name}/ - No skill.md`)
          continue
        }

        // 解析 SKILL.md
        const parsedSkill = parseSkillMd(skillMdContent)

        // 获取子目录的 marketplace.json（可选）
        const marketplaceJsonPath = skillsBaseDir
          ? `${skillsBaseDir}/${subdir.name}/marketplace.json`
          : `${subdir.name}/marketplace.json`
        const marketplaceJsonContent = await githubApi.getFileContent(owner, repo, marketplaceJsonPath)
        const marketplaceJson = marketplaceJsonContent
          ? JSON.parse(marketplaceJsonContent)
          : null

        // 自动翻译为中文
        let nameZh: string | null = null
        let descriptionZh: string | null = null

        try {
          console.log(`  🌐 正在翻译 ${parsedSkill.metadata.name}...`)
          const translations = await translateSkillData({
            name: parsedSkill.metadata.name,
            description: parsedSkill.metadata.description,
          })
          nameZh = translations.nameZh
          descriptionZh = translations.descriptionZh
          if (nameZh) console.log(`    ✓ 名称: ${nameZh}`)
          if (descriptionZh) console.log(`    ✓ 描述已翻译`)
        } catch (error) {
          // 翻译失败不影响主流程
          console.warn(`  ⚠ 翻译失败: ${error instanceof Error ? error.message : String(error)}`)
        }

        // 构建唯一的 slug（包含仓库名和子目录名）
        // 例如: algorithmic-art-anthropic-skills
        const baseSlug = marketplaceJson?.id || generateSlug(parsedSkill.metadata.name)
        const uniqueSlug = `${baseSlug}-${repo}` // 确保唯一性

        // 构建安装命令（指向子目录）
        const installCommand = marketplaceJson?.installCommand ||
          extractInstallCommand(`${owner}/${repo}`, subdir.name)

        const skillData: SkillInput = {
          name: parsedSkill.metadata.name,
          nameZh,
          slug: uniqueSlug,
          description: parsedSkill.metadata.description,
          descriptionZh,
          repository: `${owner}/${repo}`,
          author: owner,
          authorId: String(repoData.owner.id),
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          lastCommit: new Date(repoData.pushed_at),
          skillMdContent,
          readmeContent: readme, // 使用仓库的 README
          marketplaceJson,
          installCommand,
          isOfficial: owner === 'anthropics',
          isVerified: repoData.stargazers_count >= 100,
          isActive: true,
          featured: repoData.stargazers_count >= 1000,
          viewCount: 0,
          usageCount: 0,
          rating: 0,
          ratingCount: 0,
          categories: [],
          tags: [],
        }

        skills.push(skillData)
        stats.success++
        if (verbose) console.log(`  ✓ ${subdir.name}/ - ${parsedSkill.metadata.name}`)
      } catch (error) {
        stats.failed++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        stats.errors.push({ repo: `${owner}/${repo}/${subdir.name}`, error: errorMsg })
        if (verbose) console.log(`  ✗ ${subdir.name}/ - ${errorMsg}`)
      }
    }

    console.log(`\nMulti-skill repository ${owner}/${repo}:`)
    console.log(`  Total: ${stats.total}`)
    console.log(`  Success: ${stats.success}`)
    console.log(`  Failed: ${stats.failed}`)

    return { skills, stats }
  } catch (error) {
    console.error(`Failed to scrape multi-skill repository ${owner}/${repo}:`, error)
    return { skills, stats }
  }
}

/**
 * 从 Awesome 列表爬取 Skills
 */
export async function scrapeAwesomeList(
  awesomeListOwner: string,
  awesomeListRepo: string,
  options: { verbose?: boolean; concurrency?: number } = {}
): Promise<{ skills: SkillInput[]; stats: ScrapeStats }> {
  const { verbose = false, concurrency = 5 } = options
  const skills: SkillInput[] = []
  const stats: ScrapeStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  try {
    if (verbose) console.log(`\n[Awesome List] Fetching ${awesomeListOwner}/${awesomeListRepo}...`)

    // 读取 README.md
    const readme = await githubApi.getReadme(awesomeListOwner, awesomeListRepo)

    if (!readme) {
      console.log(`No README found for ${awesomeListOwner}/${awesomeListRepo}`)
      return { skills, stats }
    }

    // 解析 README 中的仓库链接
    const repoLinks = extractRepoLinks(readme)
    stats.total = repoLinks.length

    if (verbose) console.log(`Found ${repoLinks.length} repositories`)

    // 并发爬取所有仓库（限制并发数）
    for (let i = 0; i < repoLinks.length; i += concurrency) {
      const batch = repoLinks.slice(i, i + concurrency)
      const results = await Promise.allSettled(
        batch.map((link) => scrapeRepository(link.owner, link.repo, { verbose }))
      )

      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        const link = batch[j]

        if (result.status === 'fulfilled' && result.value) {
          skills.push(result.value)
          stats.success++
          if (verbose) console.log(`  ✓ ${link.owner}/${link.repo}`)
        } else {
          stats.failed++
          const errorMsg = result.status === 'rejected'
            ? result.reason?.message || 'Unknown error'
            : 'No SKILL.md found'
          stats.errors.push({ repo: `${link.owner}/${link.repo}`, error: errorMsg })
          if (verbose) console.log(`  ✗ ${link.owner}/${link.repo}: ${errorMsg}`)
        }
      }

      if (verbose) console.log(`Progress: ${Math.min(i + concurrency, repoLinks.length)}/${repoLinks.length}`)
    }

    console.log(`\nAwesome List scrape complete:`)
    console.log(`  Total: ${stats.total}`)
    console.log(`  Success: ${stats.success}`)
    console.log(`  Failed: ${stats.failed}`)

    return { skills, stats }
  } catch (error) {
    console.error('Failed to scrape awesome list:', error)
    return { skills, stats }
  }
}

/**
 * 从文本中提取仓库链接
 */
function extractRepoLinks(text: string): Array<{ owner: string; repo: string }> {
  const links: Array<{ owner: string; repo: string }> = []

  // 匹配 GitHub 仓库链接的正则表达式
  const githubUrlRegex = /https?:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/g

  let match
  const seen = new Set<string>()

  while ((match = githubUrlRegex.exec(text)) !== null) {
    const owner = match[1]
    const repo = match[2].replace(/\.git$/, '') // 移除 .git 后缀

    const key = `${owner}/${repo}`
    if (!seen.has(key)) {
      seen.add(key)
      links.push({ owner, repo })
    }
  }

  return links
}

/**
 * 搜索包含 SKILL.md 的仓库
 */
export async function searchSkillRepos(
  query: string = 'SKILL.md language:JavaScript',
  perPage = 100
): Promise<Array<{ owner: string; repo: string }>> {
  try {
    const results = await githubApi.searchCode(query, perPage)

    return results.items
      .filter((item) => item.repository)
      .map((item) => ({
        owner: item.repository.owner.login,
        repo: item.repository.name,
      }))
  } catch (error) {
    console.error('Failed to search skill repositories:', error)
    return []
  }
}

/**
 * 爬取 GitHub 组织下的所有仓库
 */
export async function scrapeOrgRepos(org: string): Promise<SkillInput[]> {
  const skills: SkillInput[] = []

  try {
    // 获取组织的所有仓库 (使用 githubApi)
    const repos = await githubApi.listOrgRepos(org)

    // 筛选包含 SKILL.md 的仓库
    const skillRepos = repos.filter((repo: any) => {
      // 可以根据名称、描述等条件筛选
      return repo.name.includes('skill') || repo.description?.includes('skill')
    })

    // 并发爬取
    const results = await Promise.allSettled(
      skillRepos.map((repo: any) => scrapeRepository(org, repo.name))
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        skills.push(result.value)
      }
    }

    return skills
  } catch (error) {
    console.error(`Failed to scrape organization ${org}:`, error)
    return skills
  }
}
