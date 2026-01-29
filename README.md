# GLM Skills Hub

> AI Agent Skills 中文聚合平台

## 项目简介

GLM Skills Hub 是一个面向中文开发者的 AI Agent Skills 聚合平台，致力于收集、整理、展示市面上的 Claude Skills 和其他 AI Agent 技能，提供中文介绍、使用指南和在线试用服务。

## 功能特性

- 🎯 **Skills 聚合** - 收集 GitHub 上的优质 Skills
- 🔍 **智能搜索** - AI 语义搜索和关键词搜索
- 🏷️ **分类浏览** - 按功能、技术栈、场景分类
- 🇨🇳 **中文本地化** - 提供中文介绍和使用指南
- 🧪 **在线试用** - 部分 Skills 支持在线试用体验
- 💬 **社区互动** - 评分、评论、收藏功能

## 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL + Prisma ORM
- **部署**: Vercel

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- Docker & Docker Compose（用于本地数据库）

### 安装

详细的安装步骤请查看 [项目启动 SOP](./docs/SETUP.md)。

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写必要配置

# 启动数据库（Docker）
docker-compose up -d postgres

# 初始化数据库
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看网站。

> 遇到问题？查看 [故障排查指南](./docs/SETUP.md#常见问题排查)

### 主要命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run db:push      # 同步数据库模型
npm run db:migrate   # 运行数据库迁移
npm run db:studio    # 打开 Prisma Studio
npm run scraper      # 运行爬虫同步
npm run test         # 运行测试
```

## 项目结构

```
├── app/              # Next.js App Router 页面
├── components/       # React 组件
├── lib/              # 工具库和配置
├── prisma/           # 数据库模型
├── public/           # 静态资源
└── docs/             # 项目文档
```

## 贡献指南

欢迎贡献代码、提交 Skills、贡献翻译！

查看 [CONTRIBUTING.md](./docs/CONTRIBUTING.md) 了解详情。

## 许可证

MIT License

---

Made with ❤️ by the GLM Skills Hub team
