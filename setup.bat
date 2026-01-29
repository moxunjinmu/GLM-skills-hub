@echo off
setlocal enabledelayedexpansion

REM GLM Skills Hub 项目初始化脚本 (Windows)

echo ========================================
echo   GLM Skills Hub 项目初始化
echo ========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [√] Docker 检查通过
echo.

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [√] Node.js 检查通过
echo.

REM 检查 .env 文件
if not exist .env (
    echo [!] .env 文件不存在，正在创建...
    if exist .env.example (
        copy .env.example .env >nul
        echo [√] 已创建 .env 文件（基于 .env.example）
        echo [!] 请根据实际情况修改 .env 中的配置
    ) else (
        echo [错误] .env.example 文件不存在
        pause
        exit /b 1
    )
) else (
    echo [√] .env 文件已存在
)
echo.

echo ========================================
echo   步骤 1: 安装依赖
echo ========================================
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [√] 依赖安装完成
echo.

echo ========================================
echo   步骤 2: 启动 PostgreSQL 数据库
echo ========================================
docker-compose up -d postgres
if %errorlevel% neq 0 (
    echo [错误] 数据库启动失败
    pause
    exit /b 1
)

REM 等待数据库就绪
echo 等待数据库启动...
set /a count=0
:wait_loop
if !count! geq 30 (
    echo [错误] 数据库启动超时
    pause
    exit /b 1
)
docker exec glm-skills-hub-db pg_isready -U glm_skills >nul 2>&1
if %errorlevel% equ 0 (
    echo [√] 数据库已就绪
    goto db_ready
)
timeout /t 1 /nobreak >nul
set /a count+=1
goto wait_loop

:db_ready
echo.

echo ========================================
echo   步骤 3: 初始化数据库
echo ========================================
call npx prisma generate
if %errorlevel% neq 0 (
    echo [错误] Prisma Client 生成失败
    pause
    exit /b 1
)
echo [√] Prisma Client 生成完成

call npx prisma db push --skip-generate
if %errorlevel% neq 0 (
    echo [错误] 数据库 Schema 推送失败
    pause
    exit /b 1
)
echo [√] 数据库 Schema 推送完成
echo.

REM 可选：运行种子数据
if exist prisma\seed.ts (
    echo.
    set /p response="是否要导入种子数据？(y/N): "
    if /i "!response!"=="y" (
        call npm run db:seed
        if %errorlevel% equ 0 (
            echo [√] 种子数据导入完成
        )
    )
)

echo.
echo ========================================
echo   初始化完成！
echo ========================================
echo.
echo 现在您可以运行以下命令启动开发服务器：
echo.
echo   npm run dev
echo.
echo 然后访问 http://localhost:3000
echo.
echo 其他可用命令：
echo   npm run build        # 构建生产版本
echo   npm run db:studio    # 打开 Prisma Studio
echo   npm run lint         # 代码检查
echo.
pause
