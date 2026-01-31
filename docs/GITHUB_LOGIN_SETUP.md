# GitHub 登录配置指南

> **目的**: 快速配置 GitHub OAuth 登录功能

---

## ✅ 已完成的代码部分

以下文件已实现，无需修改：

| 文件 | 状态 |
|------|------|
| `lib/auth/config.ts` | ✅ NextAuth 配置（含 createUser 事件处理 githubId） |
| `app/api/auth/[...nextauth]/route.ts` | ✅ API 路由 |
| `prisma/schema.prisma` | ✅ 数据模型（User.githubId 为可选字段） |
| `components/providers/session-provider.tsx` | ✅ SessionProvider |
| `components/auth/login-button.tsx` | ✅ 登录按钮组件 |
| `app/auth/signin/page.tsx` | ✅ 登录页面 |
| `app/auth/error/page.tsx` | ✅ 错误页面 |
| `types/next-auth.d.ts` | ✅ TypeScript 类型定义 |

---

## 🔧 需要你做的配置

### 步骤 1: 创建 GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击左侧 **"OAuth Apps"**
3. 点击右上角 **"New OAuth App"**

### 步骤 2: 填写应用信息

| 字段 | 开发环境值 | 生产环境值 |
|------|-----------|-----------|
| Application name | `GLM Skills Hub (Dev)` | `GLM Skills Hub` |
| Homepage URL | `http://localhost:3000` | `https://glm-skills-hub.vercel.app` |
| Application description | `AI Agent Skills 中文聚合平台` | `AI Agent Skills 中文聚合平台` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` | `https://glm-skills-hub.vercel.app/api/auth/callback/github` |

### 步骤 3: 获取凭据

创建后获得：
- **Client ID**: 直接显示（如 `Iv1.xxx...`）
- **Client Secret**: 点击 "Generate a new client secret" 生成（如 `ghp_xxx...`）

### 步骤 4: 配置环境变量

在 `.env.local` 文件中添加（**开发环境**）：

```bash
# GitHub OAuth
GITHUB_CLIENT_ID="Iv1.你的ClientID"
GITHUB_CLIENT_SECRET="ghp_你的ClientSecret"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="已配置_无需修改"
```

生产环境（Vercel）环境变量：
```bash
GITHUB_CLIENT_ID="生产环境的ClientID"
GITHUB_CLIENT_SECRET="生产环境的ClientSecret"
NEXTAUTH_URL="https://glm-skills-hub.vercel.app"
NEXTAUTH_SECRET="生产环境必须配置新的随机字符串"
```

> **⚠️ 重要**: 生产环境的 `NEXTAUTH_SECRET` 必须是强随机字符串！
> 生成命令: `openssl rand -base64 32`

### 步骤 5: 同步数据库结构

由于 `githubId` 字段改为可选，需要更新数据库：

```bash
npx prisma db push
```

### 步骤 6: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

---

## 🧪 测试登录功能

### 1. 访问登录页面
```
http://localhost:3000/auth/signin
```

### 2. 点击 "使用 GitHub 登录"

### 3. 授权后检查
- ✅ 页面跳转回首页
- ✅ Header 显示用户名或邮箱
- ✅ "退出" 按钮显示

### 4. 检查数据库
```bash
npx prisma studio
```
查看 `User`、`Account`、`Session` 表是否有数据，`githubId` 字段是否被正确填充

---

## 🔍 故障排查

### 问题 1: 点击登录无反应

**检查**:
- 浏览器控制台是否有错误
- 环境变量是否正确配置
- 开发服务器是否已重启

### 问题 2: GitHub 授权后报错 `redirect_uri_mismatch`

**解决**: 确保 GitHub OAuth App 的回调 URL 与 `NEXTAUTH_URL` 完全一致

### 问题 3: 数据库错误

**解决**:
```bash
npx prisma db push
```

### 问题 4: Prisma 验证错误 `githubId is missing`

**已修复**: `githubId` 字段已改为可选，通过 `createUser` 事件在用户创建后自动填充

---

## 🚀 部署到生产环境

### Vercel 环境变量配置

在 Vercel 项目设置中添加：

| 变量名 | 值 |
|--------|-----|
| `GITHUB_CLIENT_ID` | 生产环境的 Client ID |
| `GITHUB_CLIENT_SECRET` | 生产环境的 Client Secret |
| `NEXTAUTH_URL` | `https://glm-skills-hub.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 生成的值 |

### 创建生产环境 GitHub OAuth App

回调 URL 必须是：
```
https://glm-skills-hub.vercel.app/api/auth/callback/github
```

---

## 📚 相关文档

- [SOP_GITHUB_LOGIN.md](./SOP_GITHUB_LOGIN.md) - 完整开发文档
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境变量配置
- [NextAuth.js 文档](https://authjs.dev/)
