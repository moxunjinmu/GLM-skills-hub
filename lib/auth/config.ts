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
  adapter: PrismaAdapter(prisma),
  secret: getAuthSecret(),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
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
})
