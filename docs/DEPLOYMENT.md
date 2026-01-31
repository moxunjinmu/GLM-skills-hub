# 部署指南

本文档详细介绍如何将 GLM Skills Hub 部署到生产环境。

## 📋 部署前检查清单

### 1. 环境要求
- [ ] Node.js >= 18
- [ ] PostgreSQL >= 14 (或使用 Vercel Postgres/Neon/Supabase)
- [ ] GitHub 账号（用于代码托管）
- [ ] Vercel 账号（或其他托管平台）

### 2. 必需配置
- [ ] 数据库连接 URL
- [ ] NEXTAUTH_SECRET（生成随机字符串）
- [ ] NEXTAUTH_URL（生产环境域名）

### 3. 可选配置
- [ ] ZHIPU_API_KEY（AI 语义搜索）
- [ ] GITHUB_TOKEN（GitHub 数据同步）
- [ ] GITHUB_CLIENT_ID/SECRET（GitHub 登录）

---

## 🚀 部署方式

### 方式一：Vercel 部署（推荐）

#### 步骤 1: 准备 GitHub 仓库

```bash
# 如果还没有推送到 GitHub
git remote add origin https://github.com/your-username/glm-skills-hub.git
git push -u origin main
```

#### 步骤 2: 在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目

#### 步骤 3: 配置构建设置

Vercel 会自动配置以下内容（通常不需要修改）：

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: (empty for Next.js)
Install Command: npm install
```

#### 步骤 4: 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

**必需变量：**
```bash
DATABASE_URL=你的生产数据库连接
NEXTAUTH_URL=https://你的域名.com
NEXTAUTH_SECRET=生成的随机密钥
```

**生成 NEXTAUTH_SECRET：**
```bash
# 使用项目自带脚本（推荐）
npm run generate:secret
```

**可选变量：**
```bash
ZHIPU_API_KEY=你的智谱AI密钥
GITHUB_TOKEN=你的GitHub Token
GITHUB_CLIENT_ID=你的OAuth App Client ID
GITHUB_CLIENT_SECRET=你的OAuth App Client Secret
NEXT_PUBLIC_GITHUB_ORG=你的GitHub组织名
SEARCH_MODE=hybrid
```

#### 步骤 5: 配置数据库

##### 选项 A: 使用 Vercel Postgres（推荐）

1. 在 Vercel 项目中点击 "Storage"
2. 创建新的 Postgres 数据库
3. Vercel 会自动将 `DATABASE_URL` 添加到环境变量
4. 初始化数据库：

```bash
# 在 Vercel 项目设置中添加 Cron Job 或首次部署后手动执行
# 在本地运行（连接到生产数据库）：
DATABASE_URL="你的生产数据库URL" npx prisma db push
```

##### 选项 B: 使用 Neon

1. 访问 [neon.tech](https://neon.tech)
2. 创建免费数据库
3. 复制连接字符串到 `DATABASE_URL`
4. 运行数据库迁移：

```bash
# 设置数据库 URL
export DATABASE_URL="你的生产数据库URL"

# 推送 schema
npx prisma db push

# 导入种子数据（可选）
npx prisma db seed
```

##### 选项 C: 使用 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 在 Settings → Database 获取连接字符串
4. 使用连接字符串格式：
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

#### 步骤 6: 部署

点击 "Deploy" 按钮，Vercel 会自动：
1. 安装依赖
2. 运行 `npm run build`
3. 部署到 CDN

#### 步骤 7: 自定义域名（可选）

1. 在 Vercel 项目 Settings → Domains
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

---

### 方式二：Docker 部署

#### 准备工作

1. 确保服务器已安装 Docker 和 Docker Compose
2. 确保 80、443、3000、15432 端口可用

#### 部署步骤

```bash
# 1. 克隆代码
git clone https://github.com/your-username/glm-skills-hub.git
cd glm-skills-hub

# 2. 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 3. 修改 docker-compose.yml 中的环境配置
# 确保 DATABASE_URL 指向正确的数据库

# 4. 构建并启动
docker-compose up -d

# 5. 初始化数据库
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed

# 6. 检查状态
docker-compose ps
docker-compose logs -f
```

#### 配置 Nginx 反向代理（推荐）

创建 `/etc/nginx/sites-available/glm-skills-hub`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/glm-skills-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 配置 SSL（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### 方式三：传统服务器部署

#### 准备工作

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 安装 PM2（进程管理器）
npm install -g pm2
```

#### 配置 PostgreSQL

```bash
# 创建数据库和用户
sudo -u postgres psql

CREATE DATABASE glm_skills_hub;
CREATE USER glm_skills WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE glm_skills_hub TO glm_skills;
\q
```

#### 部署应用

```bash
# 1. 克隆代码
cd /var/www
git clone https://github.com/your-username/glm-skills-hub.git
cd glm-skills-hub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
nano .env

# 重要配置：
# DATABASE_URL="postgresql://glm_skills:your_password@localhost:5432/glm_skills_hub?schema=public"
# NEXTAUTH_URL="https://your-domain.com"
# NEXTAUTH_SECRET="生成的随机密钥"

# 4. 构建项目
npm run build

# 5. 初始化数据库
npx prisma db push
npx prisma db seed

# 6. 使用 PM2 启动
pm2 start npm --name "glm-skills-hub" -- start

# 7. 保存 PM2 配置
pm2 save
pm2 startup
```

#### 配置 Nginx

与 Docker 部署相同，参考上面的 Nginx 配置。

---

## 🔒 安全配置

### 1. 环境变量安全

```bash
# 设置 .env 文件权限
chmod 600 .env

# 确保 .env 在 .gitignore 中
echo ".env" >> .gitignore
```

### 2. 数据库安全

```sql
-- 创建只读用户（用于查询）
CREATE USER glm_skills_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE glm_skills_hub TO glm_skills_readonly;
GRANT USAGE ON SCHEMA public TO glm_skills_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO glm_skills_readonly;
```

### 3. CORS 配置

在 `next.config.ts` 中配置：

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}
```

---

## 📊 监控和日志

### Vercel 部署

Vercel 提供内置的监控：
- 访问项目 Dashboard
- 查看 "Analytics" 了解访问情况
- 查看 "Logs" 了解运行日志

### Docker/传统部署

使用 PM2 监控：

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs glm-skills-hub

# 查看实时监控
pm2 monit
```

配置日志轮转：

```bash
# 安装 pm2-logrotate
pm2 install pm2-logrotate

# 配置日志轮换
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🔄 更新部署

### Vercel 自动部署

每次推送到 `main` 分支，Vercel 会自动部署。

### 手动触发部署

```bash
# Vercel CLI
npm i -g vercel
vercel --prod
```

### Docker/传统部署

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建项目
npm run build

# 重启服务（PM2）
pm2 restart glm-skills-hub

# 或 Docker
docker-compose down
docker-compose up -d --build
```

---

## 🧪 部署后验证

### 检查清单

- [ ] 网站可以正常访问
- [ ] 数据库连接正常
- [ ] 搜索功能可用
- [ ] GitHub 登录功能正常（如果配置了）
- [ ] 所有页面正常加载
- [ ] 没有控制台错误
- [ ] 移动端显示正常

### 测试命令

```bash
# 健康检查
curl https://your-domain.com/api/health

# 测试搜索 API
curl -X POST https://your-domain.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","page":1}'
```

---

## 🐛 常见问题

### 问题 1: 构建失败

**可能原因**：
- 依赖版本冲突
- 环境变量未设置

**解决方案**：
```bash
# 清除缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

### 问题 2: 数据库连接失败

**可能原因**：
- 数据库 URL 配置错误
- 防火墙阻止连接
- SSL 配置问题

**解决方案**：
```bash
# 测试数据库连接
psql $DATABASE_URL -c "SELECT 1"

# 如果是 SSL 问题，在 DATABASE_URL 添加 ?sslmode=require
```

### 问题 3: 环境变量未生效

**可能原因**：
- 环境变量未在平台上配置
- 构建后未重新部署

**解决方案**：
```bash
# Vercel: 在 Dashboard 配置环境变量后，点击 Redeploy
# Docker: 重新构建容器
docker-compose up -d --build
```

---

## 📚 相关文档

- [环境变量配置](./ENV_SETUP.md)
- [数据同步手册](./DATA_SYNC.md)
- [GitHub 登录配置](./SOP_GITHUB_LOGIN.md)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
