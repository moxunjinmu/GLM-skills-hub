import Link from 'next/link'
import { Github, Heart } from 'lucide-react'

// 从环境变量获取 GitHub 组织，如果没有配置则使用默认值
const GITHUB_ORG = process.env.NEXT_PUBLIC_GITHUB_ORG || 'your-org'
const GITHUB_REPO_URL = `https://github.com/${GITHUB_ORG}/GLM-skills-hub`

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 关于 */}
          <div>
            <h3 className="font-bold text-lg mb-4">GLM Skills Hub</h3>
            <p className="text-sm text-muted-foreground">
              AI Agent Skills 中文聚合平台，收集、整理、展示 Claude Skills 和其他 AI Agent 技能。
            </p>
          </div>

          {/* 资源 */}
          <div>
            <h4 className="font-semibold mb-4">资源</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/skills" className="text-muted-foreground hover:text-primary">
                  Skills 列表
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-primary">
                  分类浏览
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-primary">
                  使用文档
                </Link>
              </li>
            </ul>
          </div>

          {/* 社区 */}
          <div>
            <h4 className="font-semibold mb-4">社区</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contribute" className="text-muted-foreground hover:text-primary">
                  贡献 Skills
                </Link>
              </li>
              <li>
                <Link href="/translate" className="text-muted-foreground hover:text-primary">
                  贡献翻译
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  官方 Skills
                </a>
              </li>
            </ul>
          </div>

          {/* 相关 */}
          <div>
            <h4 className="font-semibold mb-4">相关链接</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://skills.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Skills.sh
                </a>
              </li>
              <li>
                <a
                  href="https://skillsmp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  SkillsMP
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Claude Code
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>
            Made with <Heart className="h-4 w-4 inline text-red-500" /> by GLM Skills Hub team
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
              aria-label="GitHub 仓库"
            >
              <Github className="h-5 w-5" />
            </a>
            <span>© 2025 GLM Skills Hub</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
