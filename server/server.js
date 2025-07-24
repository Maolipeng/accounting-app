const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const transactionRoutes = require('./routes/transactions')
const categoryRoutes = require('./routes/categories')
const budgetRoutes = require('./routes/budgets')
const userRoutes = require('./routes/users')
const aiConfigRoutes = require('./routes/aiConfig')

const app = express()
const PORT = process.env.PORT || 5000

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['*'],
  credentials: true
}))

// 请求日志
app.use(morgan('combined'))

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
})
app.use(limiter)

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai-config', aiConfigRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: '数据验证失败', details: err.message })
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: '无效的访问令牌' })
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: '访问令牌已过期' })
  }
  
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`)
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`)
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`)
})