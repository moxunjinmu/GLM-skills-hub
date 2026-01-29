import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHub from 'next-auth/providers/github'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

/**
 * 生成或获取 NEXTAUTH_SECRET
 * 开发环境自动生成，生产环境必须配置
 */
function getAuthSecret(): string {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }

  // 开发环境自动生成 secret
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] 未配置 NEXTAUTH_SECRET，使用自动生成的 secret（仅开发环境）')
    return crypto.randomBytes(32).toString('base64')
  }

  throw new Error(
    '生产环境必须配置 NEXTAUTH_SECRET 环境变量。' +
    '可以使用 openssl rand -base64 32 生成一个随机字符串。'
  )
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
