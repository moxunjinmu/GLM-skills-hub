# 数据同步手册

本文档介绍如何同步 GitHub Skills 数据到 GLM Skills Hub 数据库。

## 📊 数据同步概述

### 数据来源

本系统从以下来源同步 Skills 数据：

| 来源 | 类型 | 描述 | 数量 |
|------|------|------|------|
| anthropics/skills | 官方多技能 | Claude 官方技能仓库 | ~16 个 |
| sickn33/antigravity-awesome-skills | 社区多技能 | 社区聚合技能仓库 | 548+ 个 |
| ComposioHQ/awesome-claude-skills | 社区多技能 | Composio 技能仓库 | ~100 个 |
| GitHub 搜索 | 单技能 | 从 GitHub 搜索发现的技能 | 动态 |

### 同步内容

每个 Skill 同步以下信息：
- **基本信息**：名称、描述、作者、仓库地址
- **统计数据**：Stars、Forks、Issues 数、最后提交时间
- **分类标签**：自动分类（开发工具、数据处理等）
- **技能文档**：从 SKILL.md 提取的详细说明

---

## 🚀 快速开始

### 方法一：通过 API 同步（推荐）

```bash
# 触发完整同步
curl -X POST https://your-domain.com/api/sync

# 仅同步 Awesome 列表
curl -X POST https://your-domain.com/api/sync/awesome

# 测试同步（不实际写入数据库）
curl -X POST https://your-domain.com/api/github/test
```

### 方法二：直接运行脚本

```bash
# 1. 编译同步脚本
npm run scraper:build

# 2. 运行同步
node dist/lib/scraper/sync-job.js
```

### 方法三：使用 tsx 直接运行（开发环境）

```bash
npx tsx lib/scraper/sync-job.ts
```

---

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置：

```bash
# GitHub Token（必需，用于 API 访问）
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub API URL（可选，默认为官方 API）
GITHUB_API_URL=https://api.github.com
```

### 同步配置

编辑 `lib/scraper/sync-job.ts` 中的 `SYNC_CONFIG`：

```typescript
const SYNC_CONFIG = {
  // 多技能仓库
  multiSkillRepos: [
    { owner: 'anthropics', repo: 'skills' },
    { owner: 'sickn33', repo: 'antigravity-awesome-skills' },
    // 添加更多...
  ],

  // 单技能仓库（官方维护的）
  officialRepos: [
    // { owner: 'user', repo: 'skill-name' },
  ],

  // Awesome 列表
  awesomeLists: [
    // { owner: 'user', repo: 'awesome-list' },
  ],

  // GitHub 搜索查询
  searchQueries: [
    'SKILL.md language:JavaScript stars:>10',
    'SKILL.md language:TypeScript stars:>10',
    'SKILL.md language:Python stars:>10',
  ],
}
```

---

## 📋 同步操作

### 1. 完整同步

同步所有配置的数据源：

```bash
# API 方式
curl -X POST https://your-domain.com/api/sync

# 脚本方式
npm run scraper:build && node dist/lib/scraper/sync-job.js
```

**预期输出**：
```
Starting Skills sync job...
Syncing official multi-skill repositories...
  anthropic/skills: 16 skills found, 0 failed
  sickn33/antigravity-awesome-skills: 548 skills found, 12 failed
Syncing official single-skill repositories...
Searching for new Skills...
Updating existing Skills...
Sync job completed: { added: 120, updated: 450, failed: 12 }
```

### 2. 同步单个仓库

```bash
# 使用 API
curl -X POST https://your-domain.com/api/sync \
  -H "Content-Type: application/json" \
  -d '{"owner":"anthropics","repo":"skills"}'
```

### 3. 仅更新统计数据

不获取新数据，只更新现有 Skills 的统计信息（stars、forks）：

```bash
curl -X POST https://your-domain.com/api/sync/stats
```

---

## ⏰ 定时同步

### 使用 Vercel Cron Jobs

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

这会每天凌晨 2 点自动同步数据。

### 使用 Linux Cron

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 2 点执行）
0 2 * * * cd /path/to/glm-skills-hub && node dist/lib/scraper/sync-job.js >> logs/sync.log 2>&1
```

### 使用 PM2

```bash
# 安装 pm2-logrotate
pm2 install pm2-logrotate

# 创建 cron 配置文件
cat > ecosystem.config.cron.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sync-job',
    script: './dist/lib/scraper/sync-job.js',
    cron_restart: '0 2 * * *',
    autorestart: false,
    watch: false
  }]
}
EOF

# 启动
pm2 start ecosystem.config.cron.js
```

---

## 🔍 监控和日志

### 查看同步日志

```bash
# API 同步（查看 Vercel 日志）
vercel logs --follow

# 脚本同步
tail -f logs/sync.log
```

### 检查同步状态

```bash
# 查看数据库中最后同步时间
npx prisma studio

# 或使用 SQL 查询
npx prisma db execute --stdin << 'EOF'
SELECT
  name,
  repository,
  synced_at,
  stars
FROM skills
ORDER BY synced_at DESC
LIMIT 10;
EOF
```

### 监控指标

关注以下指标：

| 指标 | 说明 | 正常值 |
|------|------|--------|
| `added` | 新增 Skills 数 | >0 表示有新数据 |
| `updated` | 更新 Skills 数 | >0 表示现有数据更新 |
| `failed` | 失败数量 | 应接近 0 |
| `syncedAt` | 最后同步时间 | 应在 24 小时内 |

---

## 🛠️ 故障排查

### 问题 1: GitHub API 速率限制

**错误信息**：
```
Error: API rate limit exceeded for user ID
```

**解决方案**：
1. 使用 GitHub Token 增加 API 限额
2. 添加多个 Token 轮流使用
3. 降低同步频率

```bash
# 生成新的 GitHub Token
# 访问: https://github.com/settings/tokens
# 更新 .env 文件
GITHUB_TOKEN=ghp_新的token
```

### 问题 2: 仓库不存在

**错误信息**：
```
Failed to sync owner/repo: Repository not found
```

**解决方案**：
- 检查仓库名称拼写
- 确认仓库是公开的
- 从同步配置中移除无效仓库

### 问题 3: 数据库连接失败

**错误信息**：
```
Error: Can't reach database server
```

**解决方案**：
```bash
# 检查数据库连接
echo $DATABASE_URL

# 测试连接
npx prisma db push
```

### 问题 4: SKILL.md 解析失败

**错误信息**：
```
Failed to parse SKILL.md for owner/repo
```

**解决方案**：
- 某些仓库的 SKILL.md 格式不规范
- 这是正常的，会跳过这些仓库
- 查看日志中的 `failed` 数量

---

## 📊 手动同步指南

### 添加新的数据源

编辑 `lib/scraper/sync-job.ts`：

```typescript
const SYNC_CONFIG = {
  multiSkillRepos: [
    // 添加新的多技能仓库
    { owner: 'your-org', repo: 'awesome-skills' },
  ],
  // ...
}
```

### 同步特定分类

创建自定义同步脚本：

```typescript
// scripts/sync-category.ts
import { runSyncJob } from '../lib/scraper/sync-job'

async function main() {
  // 自定义同步逻辑
  console.log('Syncing specific category...')

  // 仅同步特定仓库
  const result = await syncRepository('anthropics', 'skills')
  console.log('Result:', result)
}

main()
```

---

## 🧪 测试同步

### 本地测试

```bash
# 1. 设置环境变量
export GITHUB_TOKEN="your_token"

# 2. 运行测试同步
npx tsx lib/scraper/sync-job.ts

# 3. 检查结果
npx prisma studio
```

### 测试 API 端点

```bash
# 测试 GitHub 连接
curl https://your-domain.com/api/github/test

# 预期响应
{
  "success": true,
  "message": "GitHub API connection successful",
  "data": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4998,
      "reset": "1234567890"
    }
  }
}
```

---

## 📈 数据统计

### 查看当前数据

```bash
# 使用 Prisma Studio
npx prisma studio

# 或使用 SQL
npx prisma db execute --stdin << 'EOF'
-- 总 Skills 数
SELECT COUNT(*) as total FROM skills WHERE is_active = true;

-- 按分类统计
SELECT c.name_zh, COUNT(s.id) as count
FROM categories c
LEFT JOIN _SkillCategories sc ON c.id = sc.A
LEFT JOIN skills s ON sc.B = s.id
WHERE c.is_active = true AND s.is_active = true
GROUP BY c.id, c.name_zh
ORDER BY count DESC;

-- 最近同步的 Skills
SELECT name, repository, synced_at
FROM skills
WHERE is_active = true
ORDER BY synced_at DESC
LIMIT 20;
EOF
```

---

## 🔄 数据维护

### 清理无效数据

```sql
-- 标记超过 30 天未同步的 Skills
UPDATE skills
SET is_active = false
WHERE synced_at < NOW() - INTERVAL '30 days';

-- 删除未激活的 Skills（谨慎操作）
DELETE FROM skills
WHERE is_active = false
AND created_at < NOW() - INTERVAL '90 days';
```

### 重建搜索索引

如果使用全文搜索：

```bash
# 重新生成嵌入向量
curl -X POST https://your-domain.com/api/search/reindex
```

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [环境变量配置](./ENV_SETUP.md)
- [GitHub API 文档](https://docs.github.com/en/rest)
