'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Sparkles, TrendingUp, Clock, X } from 'lucide-react'
import { SkillCard } from '@/components/skill/skill-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface SearchResult {
  id: string
  name: string
  nameZh: string | null
  slug: string
  description: string
  descriptionZh: string | null
  repository: string
  author: string
  stars: number
  forks: number
  rating: number
  ratingCount: number
  viewCount: number
  isOfficial: boolean
  featured: boolean
  categories: Array<{ nameZh: string; slug: string; icon: string }>
  tags: Array<{ nameZh: string; slug: string }>
}

interface SearchPageProps {
  query: string
  searchResults: SearchResult[] | null
  totalCount: number
  currentPage: number
  popularSearches: Array<{ term: string; count: number }>
  suggestedSkills: SearchResult[]
}

export function SearchPage({
  query,
  searchResults,
  totalCount,
  currentPage,
  popularSearches,
  suggestedSkills,
}: SearchPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(query)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setIsSearching(true)
      const params = new URLSearchParams(searchParams.toString())
      params.set('q', searchInput.trim())
      params.delete('page')
      router.push(`/search?${params.toString()}`)
    }
  }

  const handleQuickSearch = (term: string) => {
    setSearchInput(term)
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', term)
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const hasQuery = query.trim().length > 0
  const hasResults = searchResults && searchResults.length > 0

  return (
    <div className="container py-8 max-w-5xl">
      {/* 搜索头部 */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-center">
          <Sparkles className="inline-block mr-2 h-10 w-10 text-primary" />
          AI Skills 搜索
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          智能搜索最适合的 AI Agent Skills
        </p>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索 Skills..."
            className="pl-12 pr-24 py-6 text-lg h-auto"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-24 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <Button
            type="submit"
            size="lg"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            搜索
          </Button>
        </form>

        {/* 搜索提示 */}
        {!hasQuery && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            支持 AI 语义搜索和关键词搜索
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {hasQuery && (
        <div className="mb-12">
          {/* 结果统计 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                搜索结果
                <span className="text-muted-foreground font-normal ml-2">
                  找到 {totalCount} 个结果
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                "{query}"
              </p>
            </div>
          </div>

          {/* 结果列表 */}
          {hasResults ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {searchResults!.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>

              {/* 分页 */}
              {totalCount > 12 && <Pagination totalCount={totalCount} currentPage={currentPage} query={query} />}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">未找到相关 Skills</h3>
              <p className="text-muted-foreground mb-6">
                试试其他关键词，或浏览推荐内容
              </p>
            </div>
          )}
        </div>
      )}

      {/* 空状态 - 未搜索时显示 */}
      {!hasQuery && (
        <div className="space-y-12">
          {/* 热门搜索 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">热门搜索</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <button
                  key={item.term}
                  onClick={() => handleQuickSearch(item.term)}
                  className="px-4 py-2 bg-muted hover:bg-muted-foreground/20 rounded-full text-sm transition-colors"
                >
                  {item.term}
                  <span className="text-muted-foreground ml-2">{item.count}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 推荐 Skills */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">精选推荐</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/skills"
                className="text-primary hover:underline"
              >
                查看所有 Skills →
              </Link>
            </div>
          </section>

          {/* 最近搜索 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">搜索技巧</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">💡 关键词搜索</h3>
                <p className="text-sm text-muted-foreground">
                  输入 "React"、"测试"、"部署" 等关键词快速查找相关 Skills
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">🤖 AI 语义搜索</h3>
                <p className="text-sm text-muted-foreground">
                  用自然语言描述你的需求，如"帮我优化代码性能"
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">🏷️ 分类筛选</h3>
                <p className="text-sm text-muted-foreground">
                  使用分类和标签缩小搜索范围
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">🔍 高级搜索</h3>
                <p className="text-sm text-muted-foreground">
                  组合多个关键词进行精确搜索
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function Pagination({ totalCount, currentPage, query }: { totalCount: number; currentPage: number; query: string }) {
  const totalPages = Math.ceil(totalCount / 12)
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/search?${params.toString()}`)
  }

  const pages = []
  let startPage = Math.max(1, currentPage - 2)
  let endPage = Math.min(totalPages, currentPage + 2)

  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + 4)
    } else if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4)
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <button
          onClick={() => goToPage(currentPage - 1)}
          className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
        >
          上一页
        </button>
      )}

      {startPage > 1 && (
        <>
          <button onClick={() => goToPage(1)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">
            1
          </button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => goToPage(p)}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            p === currentPage
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted'
          }`}
        >
          {p}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <button onClick={() => goToPage(totalPages)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">
            {totalPages}
          </button>
        </>
      )}

      {currentPage < totalPages && (
        <button onClick={() => goToPage(currentPage + 1)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">
          下一页
        </button>
      )}
    </div>
  )
}
