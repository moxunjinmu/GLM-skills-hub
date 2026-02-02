# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

GLM Skills Hub 是一个面向中文开发者的 AI Agent Skills 聚合平台，自动从 GitHub 同步 Claude Skills 等技能，并提供中文翻译、智能搜索和在线试用功能。

## 常用命令

### 开发
```bash
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
```

### 数据库
```bash
npm run db:init      # 初始化数据库 (生成 Prisma Client + 推送 schema)
npm run db:push      # 推送 schema 更改到数据库
npm run db:migrate   # 创建并应用迁移
npm run db:studio    # 打开 Prisma Studio (数据库 GUI)
npm run db:seed      # 运行种子数据脚本
npm run db:export    # 导出数据库数据
npm run db:import    # 导入数据库数据
```

### 爬虫与同步
```bash
npm run scraper:build  # 编译爬虫同步任务
npm run scraper        # 运行爬虫同步任务
npm run sync:translations  # 同步翻译现有技能
```

### 测试
```bash
npm run test         # 运行测试 (Vitest)
```

### 版本管理
- 版本号在 `package.json` 和 `public/version.json` 中同步
- 更新 PRD.md 时需要同步更新版本号
- PRD.md 记录功能迭代历史

## 核心架构

### 目录结构

```
app/                      # Next.js App Router
├── api/                  # API 路由 (skills/, search/, auth/, etc.)
├── [pages]/             # 页面路由
└── layout.tsx           # 根布局 (包含 Header, Footer, ThemeProvider)

lib/                     # 核心业务逻辑层
├── auth/               # NextAuth 配置
├── db/                 # Prisma 客户端单例
├── github/             # GitHub API 客户端
├── scraper/            # 爬虫 + 同步任务
├── translator/         # 智谱翻译服务
├── embeddings/         # 向量嵌入生成
├── search/             # 搜索服务 (关键词/语义/混合)
├── swr/                # SWR Hooks (客户端数据获取)
└── utils.ts            # 通用工具函数

components/              # React 组件
├── ui/                 # shadcn/ui 通用组件
├── skill/              # Skill 相关组件
├── layout/             # 布局组件 (Header, Footer)
└── [其他业务组件]

prisma/                 # 数据库
├── schema.prisma       # 数据模型定义
└── seed.ts             # 种子数据

scripts/                # 工具脚本
├── sync-translations.ts  # 翻译同步脚本
├── export-data.ts        # 数据导出
└── import-data.ts        # 数据导入
```

### 数据流架构

**爬虫同步流程：**
```
GitHub 仓库 → githubApi → github-scraper → translateSkillData()
     ↓                                                ↓
parser (SKILL.md)                              zhipu-translator
     ↓                                                ↓
skillMdContent/readmeContent                    skillMdContentZh/readmeContentZh
     ↓                                                ↓
                    Prisma.upsertSkill() (含 embedding)
```

**用户访问流程：**
```
浏览器 → app/[page]/page.tsx (服务端组件)
         ↓
         prisma.skill.findMany/Unique()
         ↓
         返回带有数据的 React 组件
         ↓
         components/ (客户端组件，useSWR 获取实时数据)
```

### 关键设计决策

1. **Server-First 渲染**：默认使用 Server Components，动态页面设置 `export const dynamic = 'force-dynamic'`

2. **嵌入向量存储在 JSON**：使用 `Json` 类型存储 embedding 数组，避免专门向量数据库

3. **增量同步优化**：通过 `lastCommit` 时间比较跳过未更新技能

4. **自动翻译集成**：爬虫流程中自动调用翻译，失败不影响入库

5. **多语言字段**：每个文本字段都有 `Zh` 后缀的中文版本 (name/nameZh, description/descriptionZh, etc.)

6. **翻译服务**：使用智谱 GLM-4-Flash，长内容限制 2000 字符，保留 Markdown 格式

7. **混合搜索**：关键词搜索 (权重 0.6) + 语义搜索 (权重 0.4) 并行执行

## 数据模型要点

- **Skill**: 核心实体，包含 `nameZh`, `descriptionZh`, `skillMdContentZh`, `readmeContentZh` 等中文字段
- **Category/Tag**: 多对多关联，使用 relation 表
- **User**: 包含 `githubId` 和 `credits` (积分系统)
- **Translation/Contribution**: 包含 `status` 状态 (PENDING/APPROVED/REJECTED)
- **嵌入向量**: `embedding` 字段存储浮点数数组

## 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://...

# GitHub (必需)
GITHUB_TOKEN=ghp_...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# 智谱 AI (翻译、嵌入)
ZHIPU_API_KEY=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# 站点
NEXT_PUBLIC_SITE_URL=...
NEXT_PUBLIC_GITHUB_ORG=...
```

## 开发注意事项

1. **修改 schema 后**: 运行 `npm run db:push` 同步数据库

2. **新增 API 路由**: 在 `app/api/` 下创建 `[resource]/route.ts`，支持的方法导出为 `GET`, `POST`, `PUT`, `DELETE` 函数

3. **新增页面**: 在 `app/` 下创建 `[page]/page.tsx`，服务端组件直接用 `async function`

4. **客户端组件**: 文件顶部添加 `'use client'`，使用 SWR Hooks 获取数据

5. **翻译功能**: 爬虫自动翻译，手动翻译运行 `npm run sync:translations`

6. **版本管理**: 更新功能时同步 `package.json` 版本号和 `public/version.json`

## 爬虫配置

在 `lib/scraper/sync-job.ts` 的 `SYNC_CONFIG` 中配置：
- `multiSkillRepos`: 多技能仓库 (如 anthropics/skills)
- `singleSkillRepos`: 单技能仓库
- `awesomeLists`: Awesome 列表
