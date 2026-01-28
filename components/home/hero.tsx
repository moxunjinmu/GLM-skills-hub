'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container text-center">
        {/* 标题 */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
          <Sparkles className="h-4 w-4" />
          <span>AI Agent Skills 中文聚合平台</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          发现最好的{' '}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Skills
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          收集、整理、展示 Claude Skills 和其他 AI Agent 技能，提供中文介绍、使用指南和在线试用服务
        </p>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 Skills..."
              className="w-full pl-12 pr-32 py-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className={buttonVariants({
                variant: 'default',
                className: 'absolute right-2 top-1/2 -translate-y-1/2',
              })}
            >
              搜索
            </button>
          </div>
        </form>

        {/* 快速操作 */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a href="/skills" className="text-muted-foreground hover:text-primary">
            浏览全部 Skills →
          </a>
          <span className="text-muted-foreground">•</span>
          <a href="/categories" className="text-muted-foreground hover:text-primary">
            按分类浏览 →
          </a>
          <span className="text-muted-foreground">•</span>
          <a href="/contribute" className="text-muted-foreground hover:text-primary">
            提交你的 Skill →
          </a>
        </div>
      </div>
    </section>
  )
}
