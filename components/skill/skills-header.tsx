'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface SkillsHeaderProps {
  total: number
  currentSort: string
  currentSearch?: string
}

export function SkillsHeader({ total, currentSort, currentSearch }: SkillsHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(currentSearch || '')

  const sortOptions = [
    { value: 'latest', label: '最新' },
    { value: 'stars', label: 'Stars' },
    { value: 'rating', label: '评分' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'updated', label: '最近更新' },
  ]

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`/skills?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue.trim()) {
      params.set('search', searchValue.trim())
    } else {
      params.delete('search')
    }
    params.delete('page') // 重置到第一页
    router.push(`/skills?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      {/* 标题和搜索 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground">
            共 {total} 个 Skills
          </p>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索 Skills..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit" size="sm">
            搜索
          </Button>
        </form>
      </div>

      {/* 筛选和排序 */}
      <div className="flex items-center gap-4">
        {/* 排序 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">排序:</span>
          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  currentSort === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted-foreground/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
