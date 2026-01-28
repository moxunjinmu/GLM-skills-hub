/**
 * 统计数据展示组件
 */
export function StatsSection() {
  // TODO: 从数据库获取真实统计数据
  const stats = [
    { label: '收录 Skills', value: '1000+', icon: '📦' },
    { label: '活跃用户', value: '5000+', icon: '👥' },
    { label: '总使用次数', value: '50K+', icon: '⚡' },
    { label: '中文翻译', value: '800+', icon: '🇨🇳' },
  ]

  return (
    <section className="border-y bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
