import Link from 'next/link'

// TODO: 从数据库获取分类数据
const categories = [
  { name: '开发工具', nameZh: '开发工具', slug: 'dev-tools', icon: '🛠️', count: 256 },
  { name: '数据处理', nameZh: '数据处理', slug: 'data-processing', icon: '📊', count: 128 },
  { name: 'AI/ML', nameZh: 'AI/ML', slug: 'ai-ml', icon: '🤖', count: 189 },
  { name: 'DevOps', nameZh: 'DevOps', slug: 'devops', icon: '⚙️', count: 95 },
  { name: '设计', nameZh: '设计', slug: 'design', icon: '🎨', count: 67 },
  { name: '文档', nameZh: '文档', slug: 'documentation', icon: '📝', count: 134 },
  { name: '测试', nameZh: '测试', slug: 'testing', icon: '🧪', count: 78 },
  { name: '安全', nameZh: '安全', slug: 'security', icon: '🔒', count: 45 },
]

/**
 * 分类网格组件
 */
export function CategoriesGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="group p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <div className="text-3xl mb-3">{category.icon}</div>
          <h3 className="font-semibold mb-1">{category.nameZh}</h3>
          <p className="text-sm text-muted-foreground">
            {category.count} 个 Skills
          </p>
        </Link>
      ))}
    </div>
  )
}
