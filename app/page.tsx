import { Suspense } from 'react'
import { Hero } from '@/components/home/hero'
import { FeaturedSkills } from '@/components/home/featured-skills'
import { CategoriesGrid } from '@/components/home/categories-grid'
import { StatsSection } from '@/components/home/stats-section'
import { RecentSkills } from '@/components/home/recent-skills'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <Hero />

      {/* 统计数据 */}
      <StatsSection />

      {/* 分类浏览 */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold tracking-tight mb-8">按分类浏览</h2>
        <CategoriesGrid />
      </section>

      {/* 精选 Skills */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">精选 Skills</h2>
          <a href="/skills?featured=true" className="text-sm text-muted-foreground hover:text-primary">
            查看全部 →
          </a>
        </div>
        <Suspense fallback={<div>加载中...</div>}>
          <FeaturedSkills />
        </Suspense>
      </section>

      {/* 最新收录 */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">最新收录</h2>
          <a href="/skills?sort=latest" className="text-sm text-muted-foreground hover:text-primary">
            查看全部 →
          </a>
        </div>
        <Suspense fallback={<div>加载中...</div>}>
          <RecentSkills />
        </Suspense>
      </section>
    </div>
  )
}
