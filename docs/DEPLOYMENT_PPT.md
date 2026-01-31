---
marp: true
theme: default
paginate: true
backgroundColor: #1a1a2e
color: #eee
style: |
  section {
    font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
    font-size: 24px;
  }
  h1 {
    color: #7aa2f7;
    font-size: 48px;
  }
  h2 {
    color: #bb9af7;
    font-size: 36px;
  }
  h3 {
    color: #9aa5ce;
    font-size: 28px;
  }
  code {
    background: #16161e;
    padding: 4px 8px;
    border-radius: 4px;
  }
  pre {
    background: #16161e;
    padding: 16px;
    border-radius: 8px;
    font-size: 18px;
  }
  strong {
    color: #7dcfff;
  }
  table {
    margin: auto;
  }
  th, td {
    padding: 8px 16px;
    border: 1px solid #414868;
  }
  th {
    background: #24283b;
  }
  .emoji {
    font-size: 48px;
  }
  .center {
    text-align: center;
  }
  .highlight {
    color: #e0af68;
  }
---

<!-- _class: center -->

# GLM Skills Hub
## 部署指南

---

<!-- _class: center -->

### 📋 目录

1. 部署前准备
2. Vercel 部署
3. 环境配置
4. 数据库设置
5. 数据同步
6. 常见问题

---

<!-- _class: center -->
# 🎯 部署前准备

---

## 部署前检查清单

### 环境要求

- ✅ Node.js >= 18
- ✅ PostgreSQL >= 14
- ✅ GitHub 账号
- ✅ Vercel 账号
- ✅ GitHub Token

### 必需配置

- ✅ 数据库连接 URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL

---

## 📦 准备 GitHub 仓库

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/你的用户名/glm-skills-hub.git
git push -u origin main
```

---

<!-- _class: center -->
# 🚀 Vercel 部署

---

## Vercel 部署步骤

### 1. 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"Add New Project"**
3. 导入你的 GitHub 仓库
4. Vercel 自动检测 Next.js 项目

### 2. 配置构建设置

Vercel **自动配置**：
```
Framework: Next.js
Build Command: npm run build
Install Command: npm install
```

---

## 配置环境变量

在 **Settings → Environment Variables** 添加：

### 必需变量

```bash
# 数据库
DATABASE_URL=你的数据库连接

# 认证
NEXTAUTH_URL=https://你的域名.com
NEXTAUTH_SECRET=生成的随机密钥
```

### 可选变量

```bash
# AI 搜索
ZHIPU_API_KEY=你的智谱AI密钥

# GitHub
GITHUB_TOKEN=你的GitHub Token
GITHUB_CLIENT_ID=OAuth Client ID
GITHUB_CLIENT_SECRET=OAuth Client Secret
```

---

## 🗄️ 数据库配置

### 选项 A: Vercel Postgres（推荐）

1. 在项目页面点击 **"Storage"**
2. 创建 **Postgres** 数据库
3. Vercel 自动配置 `DATABASE_URL`

### 选项 B: Neon

1. 访问 [neon.tech](https://neon.tech)
2. 创建免费数据库
3. 复制连接字符串

### 选项 C: Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 获取连接字符串

---

## 🎬 开始部署

### 点击 Deploy 按钮

Vercel 自动执行：
1. ✅ 安装依赖
2. ✅ 运行 `npm run build`
3. ✅ 部署到 CDN
4. ✅ 分配域名

### 部署完成

你会得到：
- 🌐 `.vercel.app` 域名
- 🔗 自动 HTTPS
- 🚀 全球 CDN

---

## 🔧 初始化数据库

### 方式 1: 使用 Prisma Push

```bash
# 设置生产数据库 URL
export DATABASE_URL="你的生产数据库URL"

# 推送 schema
npx prisma db push
```

### 方式 2: 使用迁移文件

```bash
npx prisma migrate deploy
```

### 导入种子数据（可选）

```bash
npm run db:seed
```

---

## 🔄 数据同步

### 触发同步 API

```bash
curl -X POST https://你的域名.com/api/sync
```

### 配置定时同步

在 `vercel.json` 中添加：

```json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 2 * * *"
  }]
}
```

每天凌晨 2 点自动同步。

---

<!-- _class: center -->
# 🔒 安全配置

---

## 环境变量安全

### ✅ 正确做法

- 使用 `.env.example` 提供模板
- 将 `.env` 添加到 `.gitignore`
- 在平台 Secrets 中配置
- 定期轮换密钥

### ❌ 错误做法

- ❌ 将真实密钥写入代码
- ❌ 提交 `.env` 到 Git
- ❌ 在公开文档中暴露密钥

---

## 生成 NEXTAUTH_SECRET

### 重要！

生产环境**必须配置** NEXTAUTH_SECRET

### 生成方法

```bash
# 方法 1: OpenSSL
openssl rand -base64 32

# 方法 2: Node.js
node -e "console.log(require('crypto')
  .randomBytes(32).toString('base64'))"

# 方法 3: Python
python3 -c "import secrets;
  print(secrets.token_urlsafe(32))"
```

---

<!-- _class: center -->
# 📊 监控和维护

---

## 监控和日志

### Vercel Dashboard

- **Analytics** - 访问统计
- **Logs** - 运行日志
- **Deployments** - 部署历史

### 检查健康状态

```bash
curl https://你的域名.com/api/health
```

## 更新部署

### 自动部署

推送代码到 `main` 分支，Vercel 自动部署。

### 手动部署

```bash
npm i -g vercel
vercel --prod
```

---

<!-- _class: center -->
# 🐛 常见问题

---

## 问题 1: 构建失败

### 原因
- 依赖版本冲突
- 环境变量未设置

### 解决

```bash
# 清除缓存
rm -rf .next node_modules
npm install
npm run build
```

---

## 问题 2: 数据库连接失败

### 检查项

- ✅ DATABASE_URL 正确配置
- ✅ 数据库已启动
- ✅ 网络可访问

### 测试连接

```bash
psql $DATABASE_URL -c "SELECT 1"
```

---

## 问题 3: 环境变量未生效

### 解决方案

1. 在 Vercel Dashboard 配置变量
2. 点击 **Redeploy**
3. 或使用 CLI: `vercel env pull`

---

<!-- _class: center -->
# 🎉 部署成功

---

## ✅ 部署后验证

### 检查清单

- [ ] 网站可以访问
- [ ] 数据库连接正常
- [ ] 搜索功能可用
- [ ] 没有控制台错误
- [ ] 移动端显示正常

---

## 🌐 访问你的网站

```
https://你的项目名.vercel.app
```

或配置自定义域名！

---

<!-- _class: center -->
# 📚 相关资源

---

## 文档索引

| 文档 | 链接 |
|------|------|
| 部署指南 | `docs/DEPLOYMENT.md` |
| 数据同步 | `docs/DATA_SYNC.md` |
| 环境变量 | `docs/ENV_SETUP.md` |

## 官方文档

- [Next.js 部署](https://nextjs.org/docs/deployment)
- [Vercel 文档](https://vercel.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)

---

<!-- _class: center -->
# 🙏 感谢

---

## 祝您部署成功！

有问题？

查看完整文档：
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

或访问：

GitHub: [github.com/你的用户名/glm-skills-hub](https://github.com)
