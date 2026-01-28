import Link from 'next/link'
import { Star, GitFork, ExternalLink } from 'lucide-react'

// TODO: 从数据库获取精选 Skills
const featuredSkills = [
  {
    slug: 'vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    nameZh: 'Vercel React 最佳实践',
    description: 'React 和 Next.js 性能优化指南，来自 Vercel 工程团队的最佳实践',
    repository: 'anthropics/skills',
    author: 'anthropics',
    stars: 12500,
    forks: 1200,
    categories: ['开发工具'],
    tags: ['React', 'Next.js'],
  },
  {
    slug: 'frontend-design',
    name: 'frontend-design',
    nameZh: '前端设计智能',
    description: '创建高质量前端界面，支持多种设计风格和 UI 组件',
    repository: 'anthropics/skills',
    author: 'anthropics',
    stars: 8900,
    forks: 670,
    categories: ['设计'],
    tags: ['UI/UX', 'Frontend'],
  },
  {
    slug: 'code-review',
    name: 'code-review',
    nameZh: '代码审查',
    description: '自动化代码审查，检查代码质量、安全漏洞和最佳实践',
    repository: 'anthropics/skills',
    author: 'anthropics',
    stars: 6700,
    forks: 450,
    categories: ['开发工具'],
    tags: ['Review', 'Quality'],
  },
]

/**
 * 精选 Skills 展示组件
 */
export async function FeaturedSkills() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredSkills.map((skill) => (
        <Link
          key={skill.slug}
          href={`/skills/${skill.slug}`}
          className="group p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors"
        >
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {skill.nameZh || skill.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {skill.author}
              </p>
            </div>
            {skill.stars > 1000 && (
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                热门
              </span>
            )}
          </div>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {skill.description}
          </p>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{skill.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span>{skill.forks.toLocaleString()}</span>
            </div>
            <a
              href={`https://github.com/${skill.repository}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-muted rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  )
}
