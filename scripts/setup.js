#!/usr/bin/env node

/**
 * GLM Skills Hub 项目初始化脚本 (跨平台)
 * 运行方式: npm run setup
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// 颜色输出（跨平台）
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}! ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.blue}========================================${colors.reset}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function execCommand(command, description) {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    log.error(`${description} 失败`)
    return false
  }
}

async function checkCommand(cmd, name) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function waitForDatabase() {
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync('docker exec glm-skills-hub-db pg_isready -U glm_skills', {
        stdio: 'ignore',
      })
      return true
    } catch {
      if (i === maxAttempts - 1) return false
      await sleep(1000)
    }
  }
  return false
}

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  console.log(`${colors.blue}========================================${colors.reset}`)
  console.log(`${colors.blue}  GLM Skills Hub 项目初始化${colors.reset}`)
  console.log(`${colors.blue}========================================${colors.reset}\n`)

  // 检查 Docker
  log.info('检查 Docker...')
  const hasDocker = await checkCommand('docker', 'Docker')
  if (!hasDocker) {
    log.error('未检测到 Docker，请先安装 Docker Desktop')
    log.info('下载地址: https://www.docker.com/products/docker-desktop/')
    process.exit(1)
  }
  log.success('Docker 检查通过\n')

  // 检查 Node.js
  log.info('检查 Node.js...')
  const hasNode = await checkCommand('node', 'Node.js')
  if (!hasNode) {
    log.error('未检测到 Node.js，请先安装 Node.js')
    log.info('下载地址: https://nodejs.org/')
    process.exit(1)
  }
  const nodeVersion = execSync('node -v', { encoding: 'utf-8' }).trim()
  log.success(`Node.js ${nodeVersion} 检查通过\n`)

  // 检查/创建 .env 文件
  const envPath = path.join(process.cwd(), '.env')
  const envExamplePath = path.join(process.cwd(), '.env.example')

  if (!fs.existsSync(envPath)) {
    log.warn('.env 文件不存在，正在创建...')
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath)
      log.success('已创建 .env 文件（基于 .env.example）')
      log.warn('请根据实际情况修改 .env 中的配置\n')
    } else {
      log.error('.env.example 文件不存在')
      process.exit(1)
    }
  } else {
    log.success('.env 文件已存在\n')
  }

  // 步骤 1: 安装依赖
  log.step('步骤 1: 安装依赖')
  if (!execCommand('npm install', '依赖安装')) {
    process.exit(1)
  }
  log.success('依赖安装完成\n')

  // 步骤 2: 启动数据库
  log.step('步骤 2: 启动 PostgreSQL 数据库')
  if (!execCommand('docker-compose up -d postgres', '数据库启动')) {
    process.exit(1)
  }

  log.info('等待数据库启动...')
  const dbReady = await waitForDatabase()
  if (!dbReady) {
    log.error('数据库启动超时')
    process.exit(1)
  }
  log.success('数据库已就绪\n')

  // 步骤 3: 初始化数据库
  log.step('步骤 3: 初始化数据库')
  if (!execCommand('npx prisma generate', 'Prisma Client 生成')) {
    process.exit(1)
  }
  log.success('Prisma Client 生成完成')

  if (!execCommand('npx prisma db push --skip-generate', '数据库 Schema 推送')) {
    process.exit(1)
  }
  log.success('数据库 Schema 推送完成\n')

  // 可选：种子数据
  const seedPath = path.join(process.cwd(), 'prisma/seed.ts')
  if (fs.existsSync(seedPath)) {
    const answer = await askQuestion('是否要导入种子数据？(y/N): ')
    if (answer.toLowerCase() === 'y') {
      if (execCommand('npm run db:seed', '种子数据导入')) {
        log.success('种子数据导入完成\n')
      }
    }
  }

  // 完成
  console.log(`${colors.green}========================================${colors.reset}`)
  console.log(`${colors.green}  初始化完成！${colors.reset}`)
  console.log(`${colors.green}========================================${colors.reset}\n`)
  log.info('现在您可以运行以下命令启动开发服务器：\n')
  console.log('  npm run dev\n')
  log.info('然后访问 http://localhost:3000\n')
  log.info('其他可用命令：')
  console.log('  npm run build        # 构建生产版本')
  console.log('  npm run db:studio    # 打开 Prisma Studio')
  console.log('  npm run db:init      # 仅初始化数据库')
  console.log('  npm run lint         # 代码检查\n')
}

main().catch((error) => {
  log.error(`初始化失败: ${error.message}`)
  process.exit(1)
})
