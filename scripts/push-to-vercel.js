/**
 * 推送数据库结构到 Vercel
 * 使用 Vercel 环境变量初始化生产数据库
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

async function pushToVercel() {
  console.log('🚀 推送数据库结构到 Vercel...\n')

  // 读取 .env.local 获取 Vercel DATABASE_URL
  const envLocalPath = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envLocalPath)) {
    console.error('❌ .env.local 文件不存在')
    console.log('请先运行: vercel env pull .env.local')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envLocalPath, 'utf-8')
  const match = envContent.match(/DATABASE_URL="([^"]+)"/)

  if (!match) {
    console.error('❌ .env.local 中找不到 DATABASE_URL')
    process.exit(1)
  }

  const databaseUrl = match[1]
  console.log(`📡 目标数据库: ${databaseUrl.substring(0, 50)}...\n`)

  // 备份当前的 .env
  const envPath = path.join(process.cwd(), '.env')
  const envBackup = fs.readFileSync(envPath, 'utf-8')

  try {
    // 临时修改 .env 使用 Vercel 数据库
    let newEnvContent = envContent
    fs.writeFileSync(envPath, newEnvContent)
    console.log('✅ 已临时切换到 Vercel 数据库\n')

    // 运行 prisma db push（忽略已存在的错误）
    console.log('⏳ 正在推送数据库结构...')
    try {
      execSync('npx prisma db push', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl }
      })
      console.log('\n✅ 数据库结构推送成功!')
    } catch (pushError) {
      // 如果是"已存在"错误，说明数据库已初始化
      if (pushError.stdout?.includes('already exists') || pushError.message?.includes('already exists')) {
        console.log('\n✅ 数据库结构已存在，跳过推送')
      } else {
        throw pushError
      }
    }

    // 运行 seed 数据
    console.log('\n⏳ 正在填充种子数据...')
    execSync('npx prisma db seed', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    })
    console.log('\n✅ 种子数据填充成功!')

  } catch (error) {
    // 种子数据失败不是致命错误，数据库已经初始化了
    if (error.message.includes('seed')) {
      console.log('\n⚠️  种子数据填充失败（可能已有数据）')
      console.log('✅ 数据库已初始化完成!')
    } else {
      console.error('\n❌ 操作失败:', error.message)
      process.exit(1)
    }
  } finally {
    // 恢复原来的 .env
    fs.writeFileSync(envPath, envBackup)
    console.log('\n✅ 已恢复本地数据库配置')
  }
}

pushToVercel()
