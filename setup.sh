#!/bin/bash

# GLM Skills Hub 项目初始化脚本
# 适用于 macOS/Linux 和 WSL

set -e  # 遇到错误立即退出

echo "========================================"
echo "  GLM Skills Hub 项目初始化"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: 未检测到 Docker，请先安装 Docker Desktop${NC}"
    echo "下载地址: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}Docker 未运行，正在尝试启动...${NC}"
    open -a Docker 2>/dev/null || {
        echo -e "${RED}请手动启动 Docker Desktop 后重新运行此脚本${NC}"
        exit 1
    }
    # 等待 Docker 启动
    echo "等待 Docker 启动..."
    sleep 10
fi

echo -e "${GREEN}✓ Docker 检查通过${NC}"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未检测到 Node.js，请先安装 Node.js${NC}"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) 检查通过${NC}"
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env 文件不存在，正在创建...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已创建 .env 文件（基于 .env.example）${NC}"
        echo -e "${YELLOW}请根据实际情况修改 .env 中的配置${NC}"
    else
        echo -e "${RED}错误: .env.example 文件不存在${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi

echo ""
echo "========================================"
echo "  步骤 1: 安装依赖"
echo "========================================"
npm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

echo "========================================"
echo "  步骤 2: 启动 PostgreSQL 数据库"
echo "========================================"
docker-compose up -d postgres

# 等待数据库就绪
echo "等待数据库启动..."
for i in {1..30}; do
    if docker exec glm-skills-hub-db pg_isready -U glm_skills &> /dev/null; then
        echo -e "${GREEN}✓ 数据库已就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}错误: 数据库启动超时${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

echo "========================================"
echo "  步骤 3: 初始化数据库"
echo "========================================"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client 生成完成${NC}"

npx prisma db push --skip-generate
echo -e "${GREEN}✓ 数据库 Schema 推送完成${NC}"

# 可选：运行种子数据
if [ -f prisma/seed.ts ]; then
    echo ""
    echo "是否要导入种子数据？(y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        npm run db:seed
        echo -e "${GREEN}✓ 种子数据导入完成${NC}"
    fi
fi
echo ""

echo "========================================"
echo "  初始化完成！"
echo "========================================"
echo ""
echo -e "${GREEN}现在您可以运行以下命令启动开发服务器：${NC}"
echo ""
echo "  npm run dev"
echo ""
echo "然后访问 http://localhost:3000"
echo ""
echo "其他可用命令："
echo "  npm run build        # 构建生产版本"
echo "  npm run db:studio    # 打开 Prisma Studio"
echo "  npm run lint         # 代码检查"
echo ""
