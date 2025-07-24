const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma