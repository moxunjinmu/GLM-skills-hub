/**
 * 生成 NEXTAUTH_SECRET
 * 使用 Node.js 内置 crypto 模块生成安全的随机字符串
 */

const crypto = require('crypto')

// 生成 32 字节的随机数据并转换为 base64
const secret = crypto.randomBytes(32).toString('base64')

console.log('生成的 NEXTAUTH_SECRET:')
console.log(secret)
console.log('')
console.log('请将此值复制到你的 .env 文件或 Vercel 环境变量中')
