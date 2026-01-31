'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LoginButton } from '@/components/auth/login-button'
import { Logo } from '@/components/logo'
import { Github, Search } from 'lucide-react'

export function Header() {
  const githubOrg = process.env.NEXT_PUBLIC_GITHUB_ORG || 'your-org'
  // 调试：在控制台输出
  if (typeof window !== 'undefined') {
    console.log('NEXT_PUBLIC_GITHUB_ORG:', process.env.NEXT_PUBLIC_GITHUB_ORG)
    console.log('Using github org:', githubOrg)
  }
  const GITHUB_REPO_URL = `https://github.com/${githubOrg}/GLM-skills-hub`

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Logo size="md" />
        </Link>

        {/* 导航 */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/skills" className="text-sm font-medium hover:text-primary transition-colors">
            Skills
          </Link>
          <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
            分类
          </Link>
          <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">
            搜索
          </Link>
          <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
            文档
          </Link>
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center space-x-4">
          <Link href="/search">
            <button className="p-2 hover:bg-accent rounded-md transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </Link>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="p-2 hover:bg-accent rounded-md transition-colors">
              <Github className="h-5 w-5" />
            </button>
          </a>

          <ThemeToggle />

          {/* 用户登录 */}
          <div className="hidden md:block">
            <LoginButton />
          </div>
        </div>
      </div>
    </header>
  )
}
