# GLM Skills Hub - 项目启动 SOP

> 本文档适用于 AI 助手和项目开发者首次启动项目的标准操作流程

## 目录

- [前置准备](#前置准备)
- [步骤 1: 安装依赖](#步骤-1-安装依赖)
- [步骤 2: 配置环境变量](#步骤-2-配置环境变量)
- [步骤 3: 启动数据库](#步骤-3-启动数据库)
- [步骤 4: 初始化数据库](#步骤-4-初始化数据库)
- [步骤 5: 生成 Prisma Client](#步骤-5-生成-prisma-client)
- [步骤 6: 启动开发服务器](#步骤-6-启动开发服务器)
- [常见问题排查](#常见问题排查)

---

## 前置准备

### 系统要求

| 组件 | 最低版本 | 推荐版本 | 检查命令 |
|------|---------|---------|---------|
| Node.js | 18.x | 20.x | `node --version` |
| npm | 9.x | 10.x | `npm --version` |
| Docker | 20.x | 最新版 | `docker --version` |
| Docker Compose | 2.x | 最新版 | `docker-compose --version` |

### 快速检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Docker 是否运行
docker info
```

---

## 步骤 1: 安装依赖

### 1.1 安装项目依赖

```bash
npm install
```

### 1.2 验证安装

```bash
# 检查 Prisma CLI
npx prisma --version

# 预期输出：
# Prisma CLI 版本信息
# @prisma/client 版本信息
```

---

## 步骤 2: 配置环境变量

### 2.1 创建 .env 文件

```bash
# 从示例文件复制
cp .env.example .env
```

### 2.2 编辑 .env 文件

**关键配置项：**

```env
# ==================== 数据库配置 ====================
# PostgreSQL 数据库连接 URL (使用 Docker Compose 启动时保持默认)
DATABASE_URL="postgresql://glm_skills:glm_skills_password@localhost:15432/glm_skills_hub?schema=public"

# ==================== GitHub 配置 ====================
# GitHub Personal Access Token (必需，用于同步 Skills 数据)
GITHUB_TOKEN="your_github_token_here"

# ==================== Claude API 配置 ====================
# Anthropic API Key (可选，用于在线试用功能)
ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# ==================== 认证配置 ====================
# GitHub OAuth App 配置 (可选，用于用户登录功能)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

### 2.3 生成 NEXTAUTH_SECRET

```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 步骤 3: 启动数据库

### 3.1 启动 Docker Desktop

1. 打开 **Docker Desktop** 应用
2. 等待 Docker 引擎启动完成（鲸鱼图标变为运行状态）

### 3.2 配置 Docker 镜像加速器（可选，解决网络问题）

如果拉取镜像失败，配置镜像加速器：

1. 打开 Docker Desktop
2. 进入 **Settings** → **Docker Engine**
3. 添加以下配置：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com"
  ]
}
```

4. 点击 **Apply & Restart**

### 3.3 启动 PostgreSQL 容器

```bash
docker-compose up -d postgres
```

**预期输出：**

```
[+] Running 1/1
 ✔ Volume "glm-skills-hub-db-data"  Created
 ✔ Container glm-skills-hub-db      Started
```

### 3.4 验证数据库运行

```bash
# 检查容器状态
docker-compose ps

# 预期输出：
# NAME                STATUS          PORTS
# glm-skills-hub-db   Up              0.0.0.0:15432->5432/tcp

# 或使用 Docker 命令
docker ps | grep postgres
```

---

## 步骤 4: 初始化数据库

### 4.1 运行数据库迁移

```bash
npx prisma migrate dev
```

**交互提示：**

```
? Enter a name for the new migration:
```

**输入迁移名称：**

```
init
```

**预期输出：**

```
Applying migration `20260129060909_init`

The following migration(s) have been created and applied from new schema changes:

prisma\migrations\
  └─ 20260129060909_init\
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v6.19.2) to .\node_modules\@prisma\client in 156ms
```

### 4.2 验证数据库表结构

```bash
# 使用 Prisma Studio 查看数据库
npx prisma studio

# 或使用 psql 连接数据库
docker exec -it glm-skills-hub-db psql -U glm_skills -d glm_skills_hub

# 在 psql 中执行
\dt  # 列出所有表
```

---

## 步骤 5: 生成 Prisma Client

### 5.1 重新生成 Prisma Client

如果在迁移后遇到 Prisma 相关错误，重新生成：

```bash
npx prisma generate
```

**预期输出：**

```
Prisma schema loaded from prisma\schema.prisma
✔ Generated Prisma Client (v6.19.2) to .\node_modules\@prisma\client in 111ms
```

---

## 步骤 6: 启动开发服务器

### 6.1 启动开发服务器

```bash
npm run dev
```

**预期输出：**

```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 2.3s
```

### 6.2 访问应用

在浏览器中打开：

```
http://localhost:3000
```

### 6.3 可用页面

| 页面 | URL | 说明 |
|------|-----|------|
| 首页 | `/` | Skills 列表 |
| 分类页 | `/categories` | 分类浏览 |
| 分类详情 | `/categories/[slug]` | 分类下的 Skills |
| 搜索页 | `/search` | 搜索功能 |
| Skill 详情 | `/skills/[slug]` | Skill 详细信息 |

---

## 常见问题排查

### 问题 1: Prisma Client 未初始化

**错误信息：**

```
@prisma/client did not initialize yet. Please run "prisma generate"
```

**解决方案：**

```bash
npx prisma generate
```

然后重启开发服务器。

---

### 问题 2: DATABASE_URL 环境变量未找到

**错误信息：**

```
error: Environment variable not found: DATABASE_URL.
```

**解决方案：**

1. 确认 `.env` 文件存在
2. 确认 `DATABASE_URL` 已正确配置
3. 重启开发服务器

```bash
# 检查 .env 文件
cat .env | grep DATABASE_URL

# 或 Windows PowerShell
Get-Content .env | Select-String DATABASE_URL
```

---

### 问题 3: 无法连接到数据库服务器

**错误信息：**

```
Can't reach database server at `localhost:15432`
```

**解决方案：**

```bash
# 检查 Docker 容器状态
docker-compose ps

# 如果容器未运行，启动它
docker-compose up -d postgres

# 查看容器日志
docker-compose logs postgres

# 等待数据库就绪（首次启动可能需要 10-30 秒）
docker exec glm-skills-hub-db pg_isready -U glm_skills
```

---

### 问题 4: Docker 镜像拉取失败

**错误信息：**

```
failed to resolve reference "docker.io/library/postgres:16-alpine": EOF
```

**解决方案：**

**方案 A：配置镜像加速器**

见 [步骤 3.2](#32-配置-docker-镜像加速器可选解决网络问题)

**方案 B：手动拉取镜像**

```bash
docker pull postgres:16-alpine
docker-compose up -d postgres
```

**方案 C：使用本地 PostgreSQL**

1. 安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
2. 创建数据库 `glm_skills_hub`
3. 修改 `.env` 中的 `DATABASE_URL` 端口为 `5432`

**方案 D：切换到 SQLite**（不推荐，需要修改 schema）

---

### 问题 5: 数据库迁移失败

**错误信息：**

```
P3006
Migration `xxx` failed to apply cleanly to the shadow database.
```

**解决方案：**

```bash
# 重置数据库（⚠️ 警告：会删除所有数据）
npx prisma migrate reset

# 或手动删除迁移记录重新迁移
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

---

### 问题 6: 端口已被占用

**错误信息：**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**

```bash
# Windows PowerShell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程（替换 <PID> 为实际进程 ID）
taskkill /PID <PID> /F

# 或使用其他端口
npm run dev -- -p 3001
```

---

## 验证清单

启动成功后，确认以下各项：

- [ ] Docker 容器 `glm-skills-hub-db` 正在运行
- [ ] `.env` 文件存在且包含 `DATABASE_URL`
- [ ] Prisma Client 已生成
- [ ] 数据库迁移已应用
- [ ] 开发服务器在 `http://localhost:3000` 运行
- [ ] 页面可访问，无数据库错误

---

## 下一步

项目启动成功后，你可以：

1. **同步数据**：运行爬虫同步 GitHub Skills 数据
   ```bash
   npm run scraper
   ```

2. **查看数据库**：使用 Prisma Studio
   ```bash
   npm run db:studio
   ```

3. **开发调试**：
   ```bash
   npm run dev
   ```

4. **查看文档**：
   - [API 文档](./API.md)
   - [PRD](./PRD.md)
   - [进度追踪](./PROGRESS.md)

---

## 停止服务

```bash
# 停止开发服务器：Ctrl + C

# 停止数据库容器
docker-compose down

# 停止数据库并删除数据卷（⚠️ 会删除数据库数据）
docker-compose down -v
```

---

## 附录

### A. 数据库连接信息

| 属性 | 值 |
|------|-----|
| Host | localhost |
| Port | 15432 |
| Database | glm_skills_hub |
| User | glm_skills |
| Password | glm_skills_password |
| Schema | public |

### B. 常用命令速查

```bash
# 数据库相关
npx prisma generate           # 生成 Prisma Client
npx prisma migrate dev        # 运行迁移
npx prisma migrate reset      # 重置数据库
npx prisma studio             # 打开 Prisma Studio
npx prisma db seed            # 运行种子脚本（如果存在）

# Docker 相关
docker-compose up -d postgres # 启动数据库
docker-compose down           # 停止数据库
docker-compose logs postgres  # 查看数据库日志
docker-compose ps             # 查看容器状态

# 开发相关
npm run dev                   # 启动开发服务器
npm run build                 # 构建生产版本
npm run lint                  # 代码检查
```

---

**SOP 版本**: 1.0.0
**最后更新**: 2026-01-29
**维护者**: GLM Skills Hub Team
