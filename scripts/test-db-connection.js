/**
 * 数据库连接诊断脚本
 * 用于测试 Prisma Data Platform 数据库连接
 */
const { Client } = require('pg');

async function testConnection() {
  console.log('=== 数据库连接诊断 ===\n');

  // 从 .env.local 读取的连接字符串
  const connectionString = 'postgres://3bac1b970bf5702f84053d63ba27db4684954d099b7e136c0d116b40d4e68522:sk_7ZowDXJSl8Ch5nZBzcXU2@db.prisma.io:5432/postgres?sslmode=require';

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('1. 正在尝试连接到 db.prisma.io:5432...');
    await client.connect();
    console.log('   ✅ 连接成功!\n');

    // 测试查询
    console.log('2. 正在测试查询...');
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('   ✅ 查询成功!');
    console.log('   服务器时间:', result.rows[0].current_time);
    console.log('   PostgreSQL 版本:', result.rows[0].version.split(' ')[0], '\n');

    // 检查表是否存在
    console.log('3. 检查数据库表...');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('   ✅ 找到', tables.rows.length, '个表:');
    tables.rows.forEach(row => console.log('   -', row.table_name));

  } catch (error) {
    console.error('   ❌ 连接失败!\n');
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);

    // 提供诊断建议
    console.error('\n=== 诊断建议 ===');
    if (error.code === 'ECONNREFUSED') {
      console.error('- 数据库服务器拒绝连接，请检查 Prisma Data Platform 项目状态');
    } else if (error.code === '28P01') {
      console.error('- 认证失败，数据库密码可能已更改，请重新生成连接字符串');
    } else if (error.code === '3D000') {
      console.error('- 数据库不存在，请检查项目配置');
    } else if (error.message.includes('certificate')) {
      console.error('- SSL 证书问题，请检查 sslmode 参数');
    } else {
      console.error('- 网络问题或数据库服务不可用');
    }

    console.error('\n=== 解决方案 ===');
    console.error('1. 访问 https://cloud.prisma.io/ 检查项目状态');
    console.error('2. 确认项目是否被暂停或配额是否用尽');
    console.error('3. 重新生成数据库连接字符串并更新 .env.local');
    console.error('4. 或考虑使用本地数据库进行开发');

  } finally {
    await client.end().catch(() => {});
  }
}

testConnection();
