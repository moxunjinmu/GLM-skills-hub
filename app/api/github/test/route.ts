import { NextResponse } from 'next/server'
import { githubApi } from '@/lib/github'

/**
 * 测试 GitHub API 连接
 */
export async function GET() {
  try {
    // 测试获取用户信息
    const { data: userData } = await (githubApi as any).octokit.rest.users.getAuthenticated()

    // 测试获取仓库信息
    const repoData = await githubApi.getRepository('anthropics', 'skills')

    // 测试速率限制
    const { data: rateLimit } = await (githubApi as any).octokit.rest.rateLimit.get()

    return NextResponse.json({
      success: true,
      message: 'GitHub API 连接成功',
      data: {
        user: {
          login: userData.login,
          name: userData.name,
          type: userData.type,
        },
        rateLimit: {
          limit: rateLimit.resources.core.remaining,
          used: rateLimit.resources.core.used,
          reset: new Date(rateLimit.resources.core.reset * 1000).toISOString(),
        },
        testRepo: {
          name: repoData.name,
          stars: repoData.stargazers_count,
        },
      },
    })
  } catch (error: any) {
    console.error('GitHub API 测试失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'GitHub API 连接失败',
      },
      { status: 500 }
    )
  }
}
