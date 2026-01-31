'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, TrendingUp, Sparkles, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Suggestion {
  id?: string
  name: string
  type: 'skill' | 'keyword' | 'hot'
  slug?: string
  stars?: number
  count?: number
}

interface SuggestionsData {
  query: string
  type: string
  suggestions: Suggestion[]
}

export function SearchSuggestions() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 防抖获取建议
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      // 显示热门搜索
      try {
        const response = await fetch('/api/suggestions?limit=8')
        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data)
        }
      } catch (error) {
        console.error('获取热门搜索失败:', error)
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`)
      const data = await response.json()
      if (data.success) {
        setSuggestions(data.data)
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // 清除之前的定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 防抖 300ms
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchSuggestions])

  // 点击外部关闭建议
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'skill' && suggestion.slug) {
      router.push(`/skills/${suggestion.slug}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(suggestion.name)}`)
    }
    setShowSuggestions(false)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'skill':
        return <Sparkles className="h-4 w-4 text-blue-400" />
      case 'hot':
        return <TrendingUp className="h-4 w-4 text-orange-400" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'skill':
        return '技能'
      case 'hot':
        return '热门'
      default:
        return '关键词'
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              setShowSuggestions(true)
              fetchSuggestions(query)
            }}
            placeholder="搜索 AI Agent Skills..."
            className="w-full pl-12 pr-4 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* 搜索建议下拉框 */}
      {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {suggestions.type === 'hot' && (
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <TrendingUp className="h-4 w-4" />
                <span>热门搜索</span>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {suggestions.suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.id || index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white truncate">{suggestion.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {getSuggestionTypeLabel(suggestion.type)}
                    </span>
                  </div>
                  {(suggestion.stars !== undefined || suggestion.count !== undefined) && (
                    <div className="text-xs text-gray-500">
                      {suggestion.stars !== undefined && `⭐ ${suggestion.stars}`}
                      {suggestion.count !== undefined && `🔥 ${suggestion.count} 次使用`}
                    </div>
                  )}
                </div>
                <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 text-center">
            按 Enter 搜索完整结果
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {showSuggestions && isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span>搜索中...</span>
          </div>
        </div>
      )}
    </div>
  )
}
