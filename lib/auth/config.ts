import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHub from 'next-auth/providers/github'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

/**
 * 生成或获取 NEXTAUTH_SECRET
 * - 开发环境：自动生成
 * - 构建阶段：使用临时 secret（避免构建失败）
 * - 生产运行时：必须配置（否则认证不可靠）
 */
function getAuthSecret(): string {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }

  // 开发环境或未配置时，使用自动生成的 secret
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] 未配置 NEXTAUTH_SECRET，使用自动生成的 secret（仅开发环境）')
    return crypto.randomBytes(32).toString('base64')
  }

  // 生产环境未配置：使用 fallback 并警告
  // 注意：这允许构建通过，但运行时必须配置正确的 NEXTAUTH_SECRET
  console.warn('[Auth] ⚠️  生产环境未配置 NEXTAUTH_SECRET，使用临时 secret')
  console.warn('[Auth] 请在部署平台配置 NEXTAUTH_SECRET 环境变量')
  console.warn('[Auth] 生成命令: npm run generate:secret')
  return crypto.randomBytes(32).toString('base64')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  secret: getAuthSecret(),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    /**
     * 将用户信息（包括 githubId、credits）添加到 session 中
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // 从数据库获取完整的用户信息
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { githubId: true, credits: true, bio: true },
        })
        if (dbUser) {
          ;(session.user as any).githubId = dbUser.githubId
          ;(session.user as any).credits = dbUser.credits
          ;(session.user as any).bio = dbUser.bio
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
  events: {
    /**
     * 在创建新用户时自动设置 githubId
     * 通过 createUser 事件处理，确保 githubId 在用户创建后立即填充
     */
    async createUser({ user }) {
      // 获取该用户的 GitHub 账号信息
      const account = await prisma.account.findFirst({
        where: { userId: user.id },
      })
      if (account?.provider === 'github') {
        await prisma.user.update({
          where: { id: user.id },
          data: { githubId: account.providerAccountId },
        })
      }
    },
  },
})
