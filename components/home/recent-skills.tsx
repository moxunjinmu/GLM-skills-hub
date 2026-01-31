import Link from 'next/link'

// TODO: 从数据库获取最新 Skills
const recentSkills = [
  {
    slug: 'new-skill-1',
    name: 'api-debugger',
    nameZh: 'API 调试器',
    description: '调试和测试 API 接口的智能工具',
    repository: 'user/api-debugger',
    author: 'contributor',
    createdAt: '2025-01-28',
  },
  {
    slug: 'new-skill-2',
    name: 'docker-helper',
    nameZh: 'Docker 助手',
    description: 'Docker 容器管理和部署辅助',
    repository: 'user/docker-helper',
    author: 'contributor2',
    createdAt: '2025-01-27',
  },
  {
    slug: 'new-skill-3',
    name: 'test-generator',
    nameZh: '测试生成器',
    description: '自动生成单元测试和集成测试',
    repository: 'user/test-generator',
    author: 'contributor3',
    createdAt: '2025-01-26',
  },
]

/**
 * 最新收录 Skills 组件
 */
export function RecentSkills() {
  return (
    <div className="space-y-4">
      {recentSkills.map((skill) => (
        <Link
          key={skill.slug}
          href={`/skills/${skill.slug}`}
          className="group block p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {skill.nameZh || skill.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {skill.createdAt}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {skill.description}
              </p>
            </div>
            <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded">
              新收录
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
