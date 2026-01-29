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
- Docker Desktop (用于 PostgreSQL 数据库)

### 一键初始化（推荐）

项目提供了自动化初始化脚本，支持 Windows/macOS/Linux：

**Windows:**
```bash
npm run setup
# 或直接运行
setup.bat
```

**macOS/Linux:**
```bash
npm run setup
# 或添加执行权限后运行
chmod +x setup.sh
./setup.sh
```

脚本会自动完成以下操作：
1. 检查 Docker 和 Node.js 环境
2. 创建 `.env` 配置文件（基于 `.env.example`）
3. 安装项目依赖
4. 启动 PostgreSQL 数据库容器
5. 初始化数据库结构
6. （可选）导入种子数据

### 手动安装

如果需要手动安装，请按以下步骤操作：

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写必要配置
# 详细配置说明请参考: [docs/ENV_SETUP.md](./docs/ENV_SETUP.md)

# 3. 启动 PostgreSQL 数据库（Docker）
docker-compose up -d postgres

# 4. 初始化数据库
npm run db:init

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看网站。

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
