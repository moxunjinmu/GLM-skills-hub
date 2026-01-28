import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { githubApi } from '@/lib/github'
import { parseSkillMd, generateSlug, extractInstallCommand } from '@/lib/scraper/skill-parser'

/**
 * 从 Awesome 列表同步 Skills
 */
async function syncFromAwesomeList(repoOwner: string, repoName: string) {
  console.log(`🔄 同步 Awesome 列表: ${repoOwner}/${repoName}`)

  try {
    // 获取 README
    const readme = await githubApi.getReadme(repoOwner, repoName)

    if (!readme) {
      return { success: false, error: 'README not found' }
    }

    // 解析 README 中的仓库链接
    const repoLinks = extractRepoLinks(readme)
    console.log(`📦 找到 ${repoLinks.length} 个仓库链接`)

    // 同步每个仓库
    const results = {
      total: repoLinks.length,
      success: 0,
      failed: 0,
      skipped: 0,
      skills: [] as Array<{ name: string; success: boolean }>,
    }

    // 为了避免 GitHub API 速率限制，只同步前 20 个
    const limit = 20
    const limitedLinks = repoLinks.slice(0, limit)

    for (const link of limitedLinks) {
      try {
        console.log(`\n⏳ 处理: ${link.owner}/${link.repo}`)

        // 获取仓库信息
        const repoData = await githubApi.getRepository(link.owner, link.repo)

        // 检查最低要求
        if (repoData.stargazers_count < 2) {
          console.log(`  ⏭️  跳过: Stars 不足 (${repoData.stargazers_count})`)
          results.skipped++
          continue
        }

        // 查找 SKILL.md
        const skillMdContent = await githubApi.getFileContent(
          link.owner,
          link.repo,
          'SKILL.md'
        )

        if (!skillMdContent) {
          console.log(`  ⏭️  跳过: 无 SKILL.md`)
          results.skipped++
          continue
        }

        // 解析 SKILL.md
        const parsedSkill = parseSkillMd(skillMdContent)
        const slug = generateSlug(parsedSkill.metadata.name)

        // 检查是否已存在
        const existing = await prisma.skill.findUnique({
          where: { slug },
        })

        // 准备数据
        const data: any = {
          name: parsedSkill.metadata.name,
          nameZh: null,
          slug,
          description: parsedSkill.metadata.description,
          descriptionZh: null,
          repository: `${link.owner}/${link.repo}`,
          author: link.owner,
          authorId: String(repoData.owner.id),
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          lastCommit: new Date(repoData.pushed_at),
          skillMdContent,
          readmeContent: readme,
          marketplaceJson: null,
          installCommand: extractInstallCommand(`${link.owner}/${link.repo}`),
          isOfficial: link.owner === 'anthropics',
          isVerified: repoData.stargazers_count >= 10,
          isActive: true,
          featured: repoData.stargazers_count >= 100,
          viewCount: existing?.viewCount || 0,
          usageCount: existing?.usageCount || 0,
          rating: existing?.rating || 0,
          ratingCount: existing?.ratingCount || 0,
        }

        if (existing) {
          // 更新
          await prisma.skill.update({
            where: { id: existing.id },
            data,
          })
          console.log(`  ✅ 更新: ${parsedSkill.metadata.name}`)
        } else {
          // 新增
          await prisma.skill.create({
            data,
          })
          console.log(`  ➕ 新增: ${parsedSkill.metadata.name}`)
        }

        results.success++
        results.skills.push({
          name: parsedSkill.metadata.name,
          success: true,
        })
      } catch (error: any) {
        console.error(`  ❌ 失败: ${error.message}`)
        results.failed++
        results.skills.push({
          name: `${link.owner}/${link.repo}`,
          success: false,
        })
      }

      // 添加延迟避免速率限制
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log(`\n✨ 同步完成!`)
    console.log(`- 成功: ${results.success}`)
    console.log(`- 失败: ${results.failed}`)
    console.log(`- 跳过: ${results.skipped}`)

    return { success: true, data: results }
  } catch (error: any) {
    console.error('同步失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 从 README 中提取仓库链接
 */
function extractRepoLinks(readme: string) {
  const links: Array<{ owner: string; repo: string }> = []

  // 匹配 GitHub 仓库链接
  const githubUrlRegex = /https?:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/g

  let match
  const seen = new Set<string>()

  while ((match = githubUrlRegex.exec(readme)) !== null) {
    const owner = match[1]
    const repo = match[2].replace(/\.git$/, '')

    const key = `${owner}/${repo}`
    if (!seen.has(key)) {
      seen.add(key)
      links.push({ owner, repo })
    }
  }

  return links
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { owner, repo } = body

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: '缺少 owner 或 repo 参数' },
        { status: 400 }
      )
    }

    const result = await syncFromAwesomeList(owner, repo)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * GET 请求返回可用的 Awesome 列表
 */
export async function GET() {
  const awesomeLists = [
    {
      owner: 'ComposioHQ',
      repo: 'awesome-claude-skills',
      name: 'Awesome Claude Skills',
      description: '精选的 Claude Skills 列表',
      stars: 1200,
    },
    {
      owner: 'sickn33',
      repo: 'antigravity-awesome-skills',
      name: 'Antigravity Awesome Skills',
      description: '社区贡献的 Skills 集合',
      stars: 500,
    },
    {
      owner: 'JimLiu',
      repo: 'baoyu-skills',
      name: 'Baoyu Skills',
      description: '中文 Skills 集合',
      stars: 300,
    },
    {
      owner: 'cexll',
      repo: 'myclaude',
      name: 'MyClaude Skills',
      description: '个人 Skills 收集',
      stars: 200,
    },
  ]

  return NextResponse.json({
    success: true,
    data: awesomeLists,
  })
}
