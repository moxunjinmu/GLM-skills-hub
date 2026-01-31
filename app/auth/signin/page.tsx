import { signIn } from '@/lib/auth/config'
import { Github } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SignInPageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const resolvedParams = await searchParams
  const error = resolvedParams.error
  const callbackUrl = resolvedParams.callbackUrl || '/'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">欢迎回来</h1>
          <p className="text-gray-400">使用 GitHub 账号登录 GLM Skills Hub</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8 shadow-xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">GH</span>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400 text-center">
                {error === 'Configuration'
                  ? '登录服务配置错误，请联系管理员'
                  : error === 'AccessDenied'
                  ? '访问被拒绝，请检查 GitHub 账号权限'
                  : '登录失败，请稍后重试'}
              </p>
            </div>
          )}

          {/* GitHub 登录按钮 */}
          <form
            action={async () => {
              'use server'
              await signIn('github', { callbackUrl })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Github className="h-5 w-5" />
              使用 GitHub 登录
            </button>
          </form>

          {/* 说明文字 */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>登录即表示您同意我们的</p>
            <p>
              <a href="#" className="text-blue-400 hover:underline">服务条款</a>
              {' '}和{' '}
              <a href="#" className="text-blue-400 hover:underline">隐私政策</a>
            </p>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>GLM Skills Hub - AI Agent Skills 中文聚合平台</p>
        </div>
      </div>
    </div>
  )
}
