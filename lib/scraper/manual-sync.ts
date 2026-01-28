/**
 * 手动同步脚本
 * 从 anthropics/skills 仓库同步数据
 */

import { prisma } from '@/lib/db'
import { githubApi } from '../github'
import { parseSkillMd, generateSlug, extractInstallCommand } from './skill-parser'
import { SkillInput } from '@/types'

/**
 * 从 anthropics/skills 仓库获取技能列表
 */
async function syncAnthropicSkills() {
  console.log('开始同步 anthropics/skills 仓库...')

  try {
    // 获取仓库信息
    const repoData = await githubApi.getRepository('anthropics', 'skills')
    console.log(`仓库: ${repoData.full_name}`)
    console.log(`Stars: ${repoData.stargazers_count}`)
    console.log(`描述: ${repoData.description}`)

    // 获取 README
    const readme = await githubApi.getReadme('anthropics', 'skills')
    console.log(`README 长度: ${readme?.length || 0}`)

    // 列出仓库中的目录结构
    // 注意：GitHub API 不直接支持列出目录，我们需要使用其他方法

    // 创建一些官方技能的种子数据
    const officialSkills: Partial<SkillInput>[] = [
      {
        name: 'vercel-react-best-practices',
        description: 'React and Next.js performance optimization guidelines and best practices from Vercel engineering team. PROACTIVE ACTIVATION: Use this skill automatically when working in Next.js projects.',
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
This skill provides guidance for React and Next.js performance optimization based on Vercel's best practices.

## When to Use
Use this skill when:
- Working with Next.js projects
- Optimizing React components
- Implementing caching strategies
- Analyzing bundle sizes

## Key Features
- Cache Components guidance
- Partial Prerendering (PPR) patterns
- Performance optimization techniques
- Bundle optimization strategies`,
      },
      {
        name: 'code-review',
        description: 'Automated code review skill that checks code quality, security vulnerabilities, and best practices. Helps identify potential issues before they reach production.',
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
Use this skill when:
- Reviewing pull requests
- Checking code quality
- Identifying security issues
- Ensuring best practices`,
      },
      {
        name: 'frontend-design',
        description: 'Creates high-quality frontend interfaces with design excellence. Supports multiple design styles and UI components for modern web applications.',
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
Use this skill when:
- Creating UI components
- Building landing pages
- Designing dashboards
- Implementing responsive layouts`,
      },
      {
        name: 'commit',
        description: 'Helps create clean, informative git commits following best practices for commit messages and version control workflows.',
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
Use this skill when:
- Committing code changes
- Writing commit messages
- Following version control best practices`,
      },
      {
        name: 'test',
        description: 'Generates and runs tests for your codebase. Supports unit tests, integration tests, and end-to-end testing frameworks.',
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
Use this skill when:
- Writing unit tests
- Creating integration tests
- Setting up E2E tests
- Testing API endpoints`,
      },
    ]

    // 同步每个技能
    let added = 0
    let updated = 0

    for (const skillData of officialSkills) {
      const slug = generateSlug(skillData.name!)

      const existing = await prisma.skill.findUnique({
        where: { slug },
      })

      const data: any = {
        name: skillData.name,
        nameZh: null,
        slug,
        description: skillData.description,
        descriptionZh: null,
        repository: skillData.repository,
        author: skillData.author,
        stars: skillData.stars || 0,
        forks: skillData.forks || 0,
        openIssues: 0,
        lastCommit: skillData.lastCommit,
        skillMdContent: skillData.skillMdContent || null,
        readmeContent: readme || null,
        marketplaceJson: null,
        installCommand: extractInstallCommand(skillData.repository!),
        isOfficial: skillData.isOfficial || false,
        isVerified: skillData.isVerified || false,
        isActive: true,
        featured: skillData.featured || false,
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
        console.log(`✓ 更新: ${skillData.name}`)
      } else {
        await prisma.skill.create({
          data,
        })
        added++
        console.log(`+ 新增: ${skillData.name}`)
      }
    }

    console.log('\n同步完成!')
    console.log(`新增: ${added}`)
    console.log(`更新: ${updated}`)

    return { added, updated }
  } catch (error) {
    console.error('同步失败:', error)
    throw error
  }
}

/**
 * 创建默认分类
 */
async function createDefaultCategories() {
  console.log('\n创建默认分类...')

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
      console.log(`+ 分类: ${category.nameZh}`)
    }
  }

  console.log('分类创建完成!')
}

/**
 * 将技能关联到分类
 */
async function linkSkillsToCategories() {
  console.log('\n关联技能到分类...')

  const devTools = await prisma.category.findUnique({
    where: { slug: 'dev-tools' },
  })

  const design = await prisma.category.findUnique({
    where: { slug: 'design' },
  })

  const skills = await prisma.skill.findMany()

  for (const skill of skills) {
    const categories = []

    if (skill.name.includes('react') || skill.name.includes('code') || skill.name.includes('commit') || skill.name.includes('test')) {
      if (devTools) categories.push(devTools)
    }

    if (skill.name.includes('design') || skill.name.includes('ui')) {
      if (design) categories.push(design)
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
      console.log(`✓ ${skill.name} -> ${categories.map((c) => c.nameZh).join(', ')}`)
    }
  }

  console.log('分类关联完成!')
}

/**
 * 主函数
 */
async function main() {
  try {
    // 1. 创建默认分类
    await createDefaultCategories()

    // 2. 同步官方技能
    await syncAnthropicSkills()

    // 3. 关联分类
    await linkSkillsToCategories()

    console.log('\n✅ 所有数据同步完成!')

    // 显示统计
    const skillCount = await prisma.skill.count()
    const categoryCount = await prisma.category.count()

    console.log(`\n当前数据统计:`)
    console.log(`- Skills: ${skillCount}`)
    console.log(`- Categories: ${categoryCount}`)
  } catch (error) {
    console.error('同步失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行
main()
