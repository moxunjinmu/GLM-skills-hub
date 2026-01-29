/**
 * GitHub 仓库爬虫
 * 用于发现和获取 Skills 仓库信息
 */

import { github, githubApi } from '@/lib/github'
import { parseSkillMd, extractInstallCommand, generateSlug } from './skill-parser'
import { SkillInput } from '@/types'

/**
 * 爬取单个仓库
 */
export async function scrapeRepository(
  owner: string,
  repo: string
): Promise<SkillInput | null> {
  try {
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

    // 如果没有 SKILL.md，尝试从 skills/ 目录查找
    let finalSkillMdContent = skillMdContent
    if (!skillMdContent) {
      // 列出 skills/ 目录
      try {
        const skillsDirContent = await githubApi.getFileContent(owner, repo, 'skills/')
        // TODO: 解析目录并找到 SKILL.md 文件
      } catch {
        // 忽略错误
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

    // 构建 Skill 数据
    const slug = marketplaceJson?.id || generateSlug(parsedSkill.metadata.name)
    const installCommand = marketplaceJson?.installCommand || extractInstallCommand(`${owner}/${repo}`)

    const skillData: SkillInput = {
      name: parsedSkill.metadata.name,
      nameZh: null, // 待翻译
      slug,
      description: parsedSkill.metadata.description,
      descriptionZh: null, // 待翻译
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
      categories: [], // 待后续分类
      tags: [], // 待后续标签
    }

    return skillData
  } catch (error) {
    console.error(`Failed to scrape repository ${owner}/${repo}:`, error)
    return null
  }
}

/**
 * 从 Awesome 列表爬取 Skills
 */
export async function scrapeAwesomeList(
  awesomeListOwner: string,
  awesomeListRepo: string
): Promise<SkillInput[]> {
  const skills: SkillInput[] = []

  try {
    // 读取 README.md
    const readme = await githubApi.getReadme(awesomeListOwner, awesomeListRepo)

    if (!readme) {
      return skills
    }

    // 解析 README 中的仓库链接
    const repoLinks = extractRepoLinks(readme)

    // 并发爬取所有仓库
    const results = await Promise.allSettled(
      repoLinks.map((link) => scrapeRepository(link.owner, link.repo))
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        skills.push(result.value)
      }
    }

    return skills
  } catch (error) {
    console.error('Failed to scrape awesome list:', error)
    return skills
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
      .filter((item: any) => item?.repository)
      .map((item: any) => ({
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
    // 获取组织的所有仓库
    const repos = await github.rest.repos.listForOrg({
      org,
      type: 'public',
      per_page: 100,
    })

    // 筛选包含 SKILL.md 的仓库
    const skillRepos = repos.data.filter((repo: any) => {
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
