const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 测试数据库连接...');
  
  try {
    // 解析数据库URL
    const dbUrl = process.env.DATABASE_URL;
    console.log('数据库URL:', dbUrl);
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }
    
    // 从URL中提取连接信息
    const url = new URL(dbUrl);
    const connectionConfig = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // 移除开头的 '/'
    };
    
    console.log('连接配置:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      database: connectionConfig.database
    });
    
    // 测试连接
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ 数据库连接成功!');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 数据库查询测试成功:', rows);
    
    await connection.end();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 建议检查:');
      console.log('   1. MySQL服务是否正在运行');
      console.log('   2. 端口号是否正确 (默认3306)');
      console.log('   3. 防火墙设置');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 建议检查:');
      console.log('   1. 用户名和密码是否正确');
      console.log('   2. 用户是否有访问数据库的权限');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 建议检查:');
      console.log('   1. 数据库是否存在');
      console.log('   2. 运行以下SQL创建数据库:');
      console.log('      CREATE DATABASE accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    }
    
    process.exit(1);
  }
}

testConnection();