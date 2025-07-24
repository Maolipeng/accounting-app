const jwt = require('jsonwebtoken')
const prisma = require('../lib/db')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, avatar: true }
    })

    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期' })
    }
    return res.status(403).json({ error: '无效的访问令牌' })
  }
}

module.exports = { authenticateToken }