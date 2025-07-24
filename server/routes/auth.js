const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const prisma = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// 用户注册
router.post('/register', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { email, username, password } = req.body

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUserByEmail) {
      return res.status(400).json({ error: '邮箱已被注册' })
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    })
    if (existingUserByUsername) {
      return res.status(400).json({ error: '用户名已被使用' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true
      }
    })

    // 为新用户创建默认分类
    const defaultCategories = [
      { name: '餐饮', icon: '🍽️', color: '#ef4444' },
      { name: '交通', icon: '🚗', color: '#3b82f6' },
      { name: '娱乐', icon: '🎮', color: '#8b5cf6' },
      { name: '购物', icon: '🛍️', color: '#f59e0b' },
      { name: '医疗', icon: '🏥', color: '#10b981' },
      { name: '教育', icon: '📚', color: '#06b6d4' },
      { name: '住房', icon: '🏠', color: '#84cc16' },
      { name: '工资', icon: '💰', color: '#22c55e' },
      { name: '投资', icon: '📈', color: '#6366f1' },
      { name: '其他', icon: '📝', color: '#6b7280' }
    ]

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id
      }))
    })

    // 生成令牌
    const token = generateToken(user.id)

    res.status(201).json({
      message: '注册成功',
      user,
      token
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

// 用户登录
router.post('/login', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { email, password } = req.body

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 生成令牌
    const token = generateToken(user.id)

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user

    res.json({
      message: '登录成功',
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({ user })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 更新用户信息
router.put('/profile', authenticateToken, [
  body('username').optional().isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
  body('avatar').optional().isURL().withMessage('头像必须是有效的URL')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { username, avatar } = req.body
    const updateData = {}

    if (username) {
      // 检查用户名是否已被其他用户使用
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: req.user.id }
        }
      })
      if (existingUser) {
        return res.status(400).json({ error: '用户名已被使用' })
      }
      updateData.username = username
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        updatedAt: true
      }
    })

    res.json({
      message: '用户信息更新成功',
      user: updatedUser
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({ error: '更新用户信息失败' })
  }
})

// 修改密码
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { currentPassword, newPassword } = req.body

    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: '当前密码错误' })
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // 更新密码
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    })

    res.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码错误:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

module.exports = router