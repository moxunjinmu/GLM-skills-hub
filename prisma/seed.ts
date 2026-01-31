import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 分类种子数据
 */
const categories = [
  {
    name: 'Development Tools',
    nameZh: '开发工具',
    slug: 'dev-tools',
    icon: '🛠️',
    color: '#3b82f6',
    description: '代码生成、重构、调试等开发工具类 Skills',
    order: 1,
  },
  {
    name: 'Data Processing',
    nameZh: '数据处理',
    slug: 'data-processing',
    icon: '📊',
    color: '#10b981',
    description: '数据转换、清洗、分析等数据处理 Skills',
    order: 2,
  },
  {
    name: 'AI/ML',
    nameZh: 'AI/ML',
    slug: 'ai-ml',
    icon: '🤖',
    color: '#8b5cf6',
    description: '模型训练、推理、优化等 AI/ML 相关 Skills',
    order: 3,
  },
  {
    name: 'DevOps',
    nameZh: 'DevOps',
    slug: 'devops',
    icon: '⚙️',
    color: '#f59e0b',
    description: 'CI/CD、部署、监控等 DevOps 相关 Skills',
    order: 4,
  },
  {
    name: 'Design',
    nameZh: '设计',
    slug: 'design',
    icon: '🎨',
    color: '#ec4899',
    description: 'UI/UX、图形、动画等设计相关 Skills',
    order: 5,
  },
  {
    name: 'Documentation',
    nameZh: '文档',
    slug: 'documentation',
    icon: '📝',
    color: '#06b6d4',
    description: '文档生成、翻译、格式化等文档处理 Skills',
    order: 6,
  },
  {
    name: 'Testing',
    nameZh: '测试',
    slug: 'testing',
    icon: '🧪',
    color: '#ef4444',
    description: '单元测试、E2E 测试等测试相关 Skills',
    order: 7,
  },
  {
    name: 'Security',
    nameZh: '安全',
    slug: 'security',
    icon: '🔒',
    color: '#6366f1',
    description: '审计、漏洞扫描等安全相关 Skills',
    order: 8,
  },
]

/**
 * 标签种子数据
 */
const tags = [
  // 技术栈标签
  { name: 'React', nameZh: 'React', slug: 'react', type: 'TECH_STACK' },
  { name: 'Vue', nameZh: 'Vue', slug: 'vue', type: 'TECH_STACK' },
  { name: 'Next.js', nameZh: 'Next.js', slug: 'nextjs', type: 'TECH_STACK' },
  { name: 'Nuxt', nameZh: 'Nuxt', slug: 'nuxt', type: 'TECH_STACK' },
  { name: 'TypeScript', nameZh: 'TypeScript', slug: 'typescript', type: 'TECH_STACK' },
  { name: 'Python', nameZh: 'Python', slug: 'python', type: 'TECH_STACK' },
  { name: 'Go', nameZh: 'Go', slug: 'go', type: 'TECH_STACK' },
  { name: 'Rust', nameZh: 'Rust', slug: 'rust', type: 'TECH_STACK' },

  // 使用场景标签
  { name: 'Code Review', nameZh: '代码审查', slug: 'code-review', type: 'USE_CASE' },
  { name: 'PR Automation', nameZh: 'PR 自动化', slug: 'pr-automation', type: 'USE_CASE' },
  { name: 'Documentation', nameZh: '文档生成', slug: 'documentation', type: 'USE_CASE' },
  { name: 'API Development', nameZh: 'API 开发', slug: 'api-development', type: 'USE_CASE' },
  { name: 'Performance', nameZh: '性能优化', slug: 'performance', type: 'USE_CASE' },
  { name: 'Testing', nameZh: '测试自动化', slug: 'testing', type: 'USE_CASE' },
  { name: 'Deployment', nameZh: '部署自动化', slug: 'deployment', type: 'USE_CASE' },
  { name: 'Refactoring', nameZh: '代码重构', slug: 'refactoring', type: 'USE_CASE' },

  // 编程语言标签（使用不同名称避免唯一约束冲突）
  { name: 'JavaScript', nameZh: 'JavaScript', slug: 'javascript', type: 'LANGUAGE' },
  { name: 'TypeScript Lang', nameZh: 'TypeScript', slug: 'typescript-lang', type: 'LANGUAGE' },
  { name: 'Python Lang', nameZh: 'Python', slug: 'python-lang', type: 'LANGUAGE' },
  { name: 'Java', nameZh: 'Java', slug: 'java', type: 'LANGUAGE' },
  { name: 'Go Lang', nameZh: 'Go', slug: 'go-lang', type: 'LANGUAGE' },
  { name: 'Rust Lang', nameZh: 'Rust', slug: 'rust-lang', type: 'LANGUAGE' },
  { name: 'C++', nameZh: 'C++', slug: 'cpp', type: 'LANGUAGE' },
  { name: 'Ruby', nameZh: 'Ruby', slug: 'ruby', type: 'LANGUAGE' },
]

/**
 * 主函数
 */
async function main() {
  console.log('🌱 开始种子数据初始化...\n')

  // 清空现有数据（可选，开发环境使用）
  // await prisma.category.deleteMany()
  // await prisma.tag.deleteMany()

  // 创建分类
  console.log('📁 创建分类...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
    console.log(`  ✓ ${category.nameZh}`)
  }

  // 创建标签
  console.log('\n🏷️  创建标签...')
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    })
    console.log(`  ✓ ${tag.nameZh || tag.name}`)
  }

  console.log('\n✅ 种子数据初始化完成！')
  console.log(`\n📊 统计：`)
  const categoryCount = await prisma.category.count()
  const tagCount = await prisma.tag.count()
  console.log(`  - 分类：${categoryCount} 个`)
  console.log(`  - 标签：${tagCount} 个`)
}

/**
 * 执行种子数据初始化
 */
main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
