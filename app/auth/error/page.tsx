import Link from 'next/link'

export const dynamic = 'force-dynamic'

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: '配置错误',
      description: '登录服务配置有误，请联系管理员检查 GitHub OAuth 配置。',
    },
    AccessDenied: {
      title: '访问被拒绝',
      description: '您没有权限访问此应用，请联系管理员。',
    },
    Verification: {
      title: '验证失败',
      description: '登录验证失败，请稍后重试。',
    },
    Default: {
      title: '登录失败',
      description: '登录过程中出现错误，请稍后重试。',
    },
  }

  const errorInfo = error && errorMessages[error]
    ? errorMessages[error]
    : errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* 错误图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="h-10 w-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* 错误信息卡片 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-gray-400 text-center mb-8">{errorInfo.description}</p>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              返回登录页面
            </Link>

            <Link
              href="/"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              返回首页
            </Link>
          </div>

          {/* 调试信息 */}
          {error && (
            <details className="mt-6">
              <summary className="text-sm text-gray-500 cursor-pointer">
                错误代码（调试用）
              </summary>
              <code className="block mt-2 p-3 bg-gray-900 rounded text-xs text-red-400">
                {error}
              </code>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
