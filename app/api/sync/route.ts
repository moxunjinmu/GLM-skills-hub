import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { githubApi } from '@/lib/github'
import { generateSlug, extractInstallCommand } from '@/lib/scraper/skill-parser'

/**
 * 手动同步官方 Skills
 */
async function syncAnthropicSkills() {
  const repoData = await githubApi.getRepository('anthropics', 'skills')
  const readme = await githubApi.getReadme('anthropics', 'skills')

  const officialSkills: any[] = [
    {
      name: 'vercel-react-best-practices',
      nameZh: 'Vercel React 最佳实践',
      description: 'React and Next.js performance optimization guidelines from Vercel engineering team.',
      descriptionZh: '来自 Vercel 工程团队的 React 和 Next.js 性能优化指南。',
      repository: 'anthropics/skills',
      author: 'anthropics',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastCommit: new Date(repoData.pushed_at),
      isOfficial: true,
      isVerified: true,
      featured: true,
      skillMdContent: `# vercel-react-best-practices

## Overview
This skill provides guidance for React and Next.js performance optimization.

## When to Use
Use this skill when working with Next.js projects, optimizing React components, or implementing caching strategies.`,
    },
    {
      name: 'code-review',
      nameZh: '代码审查',
      description: 'Automated code review that checks code quality, security vulnerabilities, and best practices.',
      descriptionZh: '自动化代码审查，检查代码质量、安全漏洞和最佳实践。',
      repository: 'anthropics/skills',
      author: 'anthropics',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastCommit: new Date(repoData.pushed_at),
      isOfficial: true,
      isVerified: true,
      featured: true,
      skillMdContent: `# code-review

## Overview
Performs comprehensive code reviews covering quality, security, and best practices.

## When to Use
Use this skill when reviewing pull requests or checking code quality.`,
    },
    {
      name: 'frontend-design',
      nameZh: '前端设计',
      description: 'Creates high-quality frontend interfaces with design excellence and modern UI patterns.',
      descriptionZh: '创建高质量前端界面，支持多种设计风格和 UI 组件。',
      repository: 'anthropics/skills',
      author: 'anthropics',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastCommit: new Date(repoData.pushed_at),
      isOfficial: true,
      isVerified: true,
      featured: true,
      skillMdContent: `# frontend-design

## Overview
Design and build high-quality frontend interfaces with modern design patterns.

## When to Use
Use this skill when creating UI components, building landing pages, or designing dashboards.`,
    },
    {
      name: 'commit',
      nameZh: '提交代码',
      description: 'Helps create clean, informative git commits following best practices.',
      descriptionZh: '帮助创建规范的 Git 提交信息，遵循最佳实践。',
      repository: 'anthropics/skills',
      author: 'anthropics',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastCommit: new Date(repoData.pushed_at),
      isOfficial: true,
      isVerified: true,
      featured: false,
      skillMdContent: `# commit

## Overview
Creates well-formatted git commits following conventional commit specification.

## When to Use
Use this skill when committing code changes or writing commit messages.`,
    },
    {
      name: 'test',
      nameZh: '测试',
      description: 'Generates and runs tests for your codebase. Supports unit tests, integration tests, and E2E testing.',
      descriptionZh: '为代码库生成和运行测试，支持单元测试、集成测试和端到端测试。',
      repository: 'anthropics/skills',
      author: 'anthropics',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastCommit: new Date(repoData.pushed_at),
      isOfficial: true,
      isVerified: true,
      featured: false,
      skillMdContent: `# test

## Overview
Comprehensive testing skill for unit, integration, and E2E tests.

## When to Use
Use this skill when writing tests or testing API endpoints.`,
    },
  ]

  let added = 0
  let updated = 0

  for (const skillData of officialSkills) {
    const slug = generateSlug(skillData.name)

    const existing = await prisma.skill.findUnique({
      where: { slug },
    })

    const data: any = {
      name: skillData.name,
      nameZh: skillData.nameZh,
      slug,
      description: skillData.description,
      descriptionZh: skillData.descriptionZh,
      repository: skillData.repository,
      author: skillData.author,
      authorId: String(repoData.owner.id),
      stars: skillData.stars,
      forks: skillData.forks,
      openIssues: repoData.open_issues_count,
      lastCommit: skillData.lastCommit,
      skillMdContent: skillData.skillMdContent,
      readmeContent: readme,
      marketplaceJson: null,
      installCommand: extractInstallCommand(skillData.repository),
      isOfficial: skillData.isOfficial,
      isVerified: skillData.isVerified,
      isActive: true,
      featured: skillData.featured,
      viewCount: 0,
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
    }

    if (existing) {
      await prisma.skill.update({
        where: { id: existing.id },
        data,
      })
      updated++
    } else {
      await prisma.skill.create({
        data,
      })
      added++
    }
  }

  return { added, updated }
}

/**
 * 创建默认分类
 */
async function createDefaultCategories() {
  const categories = [
    { name: 'DevTools', nameZh: '开发工具', slug: 'dev-tools', icon: '🛠️', order: 1 },
    { name: 'Data', nameZh: '数据处理', slug: 'data-processing', icon: '📊', order: 2 },
    { name: 'AI/ML', nameZh: 'AI/ML', slug: 'ai-ml', icon: '🤖', order: 3 },
    { name: 'DevOps', nameZh: 'DevOps', slug: 'devops', icon: '⚙️', order: 4 },
    { name: 'Design', nameZh: '设计', slug: 'design', icon: '🎨', order: 5 },
    { name: 'Docs', nameZh: '文档', slug: 'documentation', icon: '📝', order: 6 },
    { name: 'Testing', nameZh: '测试', slug: 'testing', icon: '🧪', order: 7 },
    { name: 'Security', nameZh: '安全', slug: 'security', icon: '🔒', order: 8 },
  ]

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    })

    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          description: `${category.nameZh}相关 Skills`,
          isActive: true,
        },
      })
    }
  }
}

/**
 * 将技能关联到分类
 */
async function linkSkillsToCategories() {
  const devTools = await prisma.category.findUnique({
    where: { slug: 'dev-tools' },
  })

  const design = await prisma.category.findUnique({
    where: { slug: 'design' },
  })

  const testing = await prisma.category.findUnique({
    where: { slug: 'testing' },
  })

  const skills = await prisma.skill.findMany()

  for (const skill of skills) {
    const categories = []

    if (skill.name.includes('react') || skill.name.includes('code') || skill.name.includes('commit')) {
      if (devTools) categories.push(devTools)
    }

    if (skill.name.includes('design')) {
      if (design) categories.push(design)
    }

    if (skill.name.includes('test')) {
      if (testing) categories.push(testing)
    }

    if (categories.length > 0) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          categories: {
            set: categories.map((c) => ({ id: c.id })),
          },
        },
      })
    }
  }
}

export async function GET() {
  try {
    // 1. 创建默认分类
    await createDefaultCategories()

    // 2. 同步官方技能
    const syncResult = await syncAnthropicSkills()

    // 3. 关联分类
    await linkSkillsToCategories()

    // 获取统计
    const skillCount = await prisma.skill.count()
    const categoryCount = await prisma.category.count()

    return NextResponse.json({
      success: true,
      message: '同步完成',
      data: {
        skills: {
          added: syncResult.added,
          updated: syncResult.updated,
          total: skillCount,
        },
        categories: categoryCount,
      },
    })
  } catch (error: any) {
    console.error('同步失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '同步失败',
      },
      { status: 500 }
    )
  }
}
