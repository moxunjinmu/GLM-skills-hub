# 环境变量配置指南

## 🔒 安全警告

**重要**：本项目包含需要 API 密钥的功能。这些密钥**绝对不要**提交到 Git 仓库！

## 📋 环境变量说明

### 方式一：本地开发（推荐）

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **填入你的 API 密钥**
   编辑 `.env` 文件，填入你自己的密钥：
   ```bash
   ZHIPU_API_KEY="你的智谱AI密钥"
   GITHUB_TOKEN="你的GitHub Token"
   # ... 其他密钥
   ```

3. **`.env` 文件已被 `.gitignore` 忽略，不会被提交**

### 方式二：部署平台

#### Vercel 部署
在 Vercel 项目设置中添加环境变量：
1. 进入项目 Settings → Environment Variables
2. 逐个添加环境变量（如 `ZHIPU_API_KEY`）
3. 重新部署项目

#### Docker 部署

使用 Docker Compose（推荐）：

1. **配置环境变量**
   ```bash
   # 创建 .env 文件（Docker Compose 会自动读取）
   cp .env.example .env
   # 编辑 .env 文件，填入你的密钥
   ```

2. **启动所有服务**
   ```bash
   # 构建并启动（后台运行）
   docker-compose up -d

   # 查看日志
   docker-compose logs -f app

   # 停止服务
   docker-compose down

   # 停止并删除数据卷（⚠️ 会删除数据库数据）
   docker-compose down -v
   ```

3. **初始化数据库**
   ```bash
   # 在 app 容器中执行数据库迁移
   docker-compose exec app npx prisma migrate deploy

   # 可选：填充种子数据
   docker-compose exec app npm run db:seed
   ```

4. **访问应用**
   - 应用地址: http://localhost:3000
   - 数据库端口: localhost:15432

单独运行 Docker 容器：

```bash
# 构建镜像
docker build -t glm-skills-hub .

# 运行容器
docker run -d \
  --name glm-skills-hub \
  -p 3000:3000 \
  --env-file .env \
  glm-skills-hub
```

#### 其他平台
参考各平台的文档配置环境变量。

## 🛡️ 密钥安全最佳实践

### ✅ 正确做法
- 使用 `.env.example` 提供模板（不含真实密钥）
- 将 `.env` 添加到 `.gitignore`
- 每个开发者使用自己的密钥
- 在 CI/CD 平台使用 Secrets 功能
- 定期轮换密钥

### ❌ 错误做法
- ❌ 将真实密钥写入 `.env.example`
- ❌ 将 `.env` 文件提交到 Git
- ❌ 在代码中硬编码密钥
- ❌ 在公开文档中暴露密钥

## 🔑 获取 API 密钥

### 智谱 AI (Zhipu AI)
1. 访问：https://open.bigmodel.cn/usercenter/apikeys
2. 注册/登录账号
3. 创建新的 API Key
4. 复制密钥到 `.env` 文件

**用途**：AI 语义搜索、嵌入向量生成

**费用**：新用户通常有免费额度

### GitHub Token
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择需要的权限
4. 生成并复制 Token

**用途**：访问 GitHub API、同步 Skills 数据

## ⚙️ 功能降级说明

本项目设计了**智能降级机制**，即使没有配置某些密钥，核心功能仍可正常使用：

| 功能 | 无密钥时行为 | 需要密钥 |
|------|-------------|----------|
| 关键词搜索 | ✅ 正常使用 | 无 |
| AI 语义搜索 | 🔄 降级为关键词搜索 | `ZHIPU_API_KEY` |
| GitHub 同步 | 🔄 跳过同步 | `GITHUB_TOKEN` |
| 在线试用 | 🔄 显示不可用 | `ANTHROPIC_API_KEY` |

**示例**：
```javascript
// 如果未配置 ZHIPU_API_KEY，自动降级
if (!process.env.ZHIPU_API_KEY) {
  console.warn('未配置 ZHIPU_API_KEY，使用简化嵌入算法')
  return generateFallbackEmbedding(text)
}
```

## 📝 环境变量清单

### 必需配置（核心功能可用）
```bash
# 数据库（必需）
DATABASE_URL="postgresql://..."

# 认证（登录功能必需）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="生成一个随机字符串"
```

### 可选配置（增强功能）
```bash
# AI 语义搜索
ZHIPU_API_KEY=""

# GitHub 集成
GITHUB_TOKEN=""
NEXT_PUBLIC_GITHUB_ORG="your-org"

# GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Claude API
ANTHROPIC_API_KEY=""

# 搜索模式
SEARCH_MODE="hybrid"  # keyword | semantic | hybrid
```

## 🚀 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/your-org/glm-skills-hub.git
   cd glm-skills-hub
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入你的密钥
   ```

4. **初始化数据库**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 🔍 故障排查

### 问题：搜索功能不工作
**解决方案**：
- 检查是否配置了 `DATABASE_URL`
- 确认数据库已初始化：`npm run db:push`

### 问题：AI 语义搜索降级了
**解决方案**：
- 这是正常的！如果未配置 `ZHIPU_API_KEY`，会自动降级为关键词搜索
- 配置密钥后重启服务器即可启用 AI 语义搜索

### 问题：GitHub 同步不工作
**解决方案**：
- 确认 `GITHUB_TOKEN` 已正确配置
- 检查 Token 是否有足够权限

## 📚 相关资源

- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel 环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)
- [ dotenv 使用指南](https://github.com/motdotla/dotenv)
