# GitHub 登录功能开发 SOP

> **适用对象**: AI 开发助手 / 开发者
> **目的**: 提供完整的 GitHub OAuth 登录功能开发和配置指导

---

## 📋 开发前检查清单

- [ ] 项目已配置 Next.js
- [ ] 已安装 `next-auth` (v5) 和 `@auth/prisma-adapter`
- [ ] 数据库已配置（Prisma ORM）
- [ ] 有 GitHub 账号

---

## 步骤 1: 安装依赖

### 1.1 安装 NextAuth 和 Prisma 适配器

```bash
npm install next-auth@beta @auth/prisma-adapter
```

### 1.2 验证安装

检查 `package.json` 包含：
```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.30",
    "@auth/prisma-adapter": "^2.11.1"
  }
}
```

---

## 步骤 2: 配置 Prisma 数据模型

### 2.1 更新 Prisma Schema

在 `prisma/schema.prisma` 中添加：

```prisma
// NextAuth 需要的模型
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 自定义字段
  credits       Int       @default(0)
  role          String    @default("user")
  avatar        String?
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 2.2 同步数据库

```bash
npx prisma generate
npx prisma db push
```

---

## 步骤 3: 创建 NextAuth 配置

### 3.1 创建配置文件

创建 `lib/auth/config.ts`:

```typescript
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
```

### 3.2 创建 API 路由

创建 `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth/config'

export const { GET, POST } = handlers
```

---

## 步骤 4: 创建认证组件

### 4.1 创建 AuthProvider

创建 `components/auth/auth-provider.tsx`:

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
```

### 4.2 在根布局中添加 Provider

更新 `app/layout.tsx`:

```typescript
import { AuthProvider } from '@/components/auth/auth-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

### 4.3 创建登录按钮

创建 `components/auth/login-button.tsx`:

```typescript
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <Button variant="ghost" size="sm" disabled>加载中...</Button>
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span>{session.user?.name || session.user?.email}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          退出
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" onClick={() => signIn('github')}>
      GitHub 登录
    </Button>
  )
}
```

---

## 步骤 5: 获取 GitHub OAuth 凭据

### 5.1 访问 GitHub Developer Settings

```
https://github.com/settings/developers
```

### 5.2 创建 OAuth App

1. 点击左侧 **"OAuth Apps"**
2. 点击右上角 **"New OAuth App"**

### 5.3 填写应用信息

| 字段 | 开发环境值 | 生产环境值 |
|------|-----------|-----------|
| Application name | `项目名 (Dev)` | `项目名` |
| Homepage URL | `http://localhost:3000` | `https://your-domain.com` |
| Application description | `项目描述` | `项目描述` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` | `https://your-domain.com/api/auth/callback/github` |

### 5.4 获取凭据

创建后获得：
- **Client ID**: 直接显示（如 `Iv1.1a2b3c4d5e6f7g8h`）
- **Client Secret**: 点击 "Generate a new client secret" 生成

### 5.5 配置环境变量

在 `.env` 文件中添加：

```bash
# GitHub OAuth
GITHUB_CLIENT_ID="Iv1.你的ClientID"
GITHUB_CLIENT_SECRET="ghp_你的ClientSecret"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
# 生产环境必须配置
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

---

## 步骤 6: 类型定义

### 6.1 扩展 NextAuth 类型

创建 `types/next-auth.d.ts`:

```typescript
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    credits?: number
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
```

---

## 步骤 7: 服务端使用认证

### 7.1 在 Server Component 中获取会话

```typescript
import { auth } from '@/lib/auth/config'

export default async function Page() {
  const session = await auth()

  if (!session) {
    return <div>请先登录</div>
  }

  return <div>欢迎, {session.user.name}!</div>
}
```

### 7.2 在 API Route 中获取会话

```typescript
import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 业务逻辑...
}
```

---

## 步骤 8: 测试验证

### 8.1 启动开发服务器

```bash
npm run dev
```

### 8.2 访问登录页面

```
http://localhost:3000/api/auth/signin
```

### 8.3 测试流程

1. 点击 "Sign in with GitHub"
2. 跳转到 GitHub 授权页面
3. 点击 "Authorize"
4. 回到应用，检查是否登录成功
5. 检查数据库 User、Account、Session 表是否有数据

---

## 故障排查

### 问题 1: 回调 URL 不匹配

**错误**: `redirect_uri_mismatch`

**解决**:
- 检查 GitHub OAuth App 的回调 URL 是否完全匹配
- 包括协议 (http/https)、域名、端口、路径

### 问题 2: 缺少 NEXTAUTH_SECRET

**错误**: `MissingSecret`

**解决**:
```bash
# 生成 secret
openssl rand -base64 32

# 添加到 .env
NEXTAUTH_SECRET="生成的值"
```

### 问题 3: 数据库连接失败

**错误**: `Can't reach database server`

**解决**:
- 检查 `DATABASE_URL` 是否正确
- 运行 `npx prisma db push` 同步表结构

### 问题 4: Provider 配置错误

**错误**: GitHub 登录按钮点击无反应

**解决**:
- 检查 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否正确
- 查看控制台错误信息

---

## 生产环境部署清单

- [ ] 更新 `NEXTAUTH_URL` 为生产域名
- [ ] 配置 `NEXTAUTH_SECRET`（强随机字符串）
- [ ] 在 GitHub 创建生产环境的 OAuth App
- [ ] 更新生产 OAuth App 的回调 URL
- [ ] 配置数据库连接字符串
- [ ] 设置数据库 SSL 模式（如需要）

---

## 安全最佳实践

1. **永远不要**将 `GITHUB_CLIENT_SECRET` 提交到 Git
2. **永远不要**在客户端代码中使用 `NEXTAUTH_SECRET`
3. **定期轮换** `NEXTAUTH_SECRET`
4. 使用 **HTTPS**（生产环境必须）
5. 限制 OAuth App 的 **组织权限**（如适用）

---

## 相关文档

- [NextAuth.js 官方文档](https://authjs.dev/)
- [GitHub OAuth Apps 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Prisma 文档](https://www.prisma.io/docs)
