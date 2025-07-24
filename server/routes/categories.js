const express = require('express')
const { body, validationResult } = require('express-validator')
const prisma = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取用户的所有分类
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json({ categories })
  } catch (error) {
    console.error('获取分类错误:', error)
    res.status(500).json({ error: '获取分类失败' })
  }
})

// 获取单个分类
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!category) {
      return res.status(404).json({ error: '分类不存在' })
    }

    res.json({ category })
  } catch (error) {
    console.error('获取分类错误:', error)
    res.status(500).json({ error: '获取分类失败' })
  }
})

// 创建新分类
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 20 }).withMessage('分类名称长度应在1-20个字符之间'),
  body('icon').trim().isLength({ min: 1 }).withMessage('图标不能为空'),
  body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('颜色格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { name, icon, color } = req.body

    // 检查分类名称是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId: req.user.id
      }
    })

    if (existingCategory) {
      return res.status(400).json({ error: '分类名称已存在' })
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon,
        color,
        userId: req.user.id
      }
    })

    res.status(201).json({
      message: '分类创建成功',
      category
    })
  } catch (error) {
    console.error('创建分类错误:', error)
    res.status(500).json({ error: '创建分类失败' })
  }
})

// 更新分类
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 20 }).withMessage('分类名称长度应在1-20个字符之间'),
  body('icon').optional().trim().isLength({ min: 1 }).withMessage('图标不能为空'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('颜色格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { id } = req.params
    const { name, icon, color } = req.body

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingCategory) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 如果更新名称，检查是否与其他分类重名
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name,
          userId: req.user.id,
          NOT: { id }
        }
      })

      if (duplicateCategory) {
        return res.status(400).json({ error: '分类名称已存在' })
      }
    }

    const updateData = {}
    if (name) updateData.name = name
    if (icon) updateData.icon = icon
    if (color) updateData.color = color

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    })

    res.json({
      message: '分类更新成功',
      category
    })
  } catch (error) {
    console.error('更新分类错误:', error)
    res.status(500).json({ error: '更新分类失败' })
  }
})

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingCategory) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 检查是否有交易记录使用此分类
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId: id,
        userId: req.user.id
      }
    })

    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: '无法删除分类，该分类下还有交易记录',
        transactionCount
      })
    }

    await prisma.category.delete({
      where: { id }
    })

    res.json({ message: '分类删除成功' })
  } catch (error) {
    console.error('删除分类错误:', error)
    res.status(500).json({ error: '删除分类失败' })
  }
})

// 获取分类使用统计
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params

    // 检查分类是否存在且属于当前用户
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!category) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 获取该分类的交易统计
    const [incomeStats, expenseStats, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          categoryId: id,
          userId: req.user.id,
          type: 'income'
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: {
          categoryId: id,
          userId: req.user.id,
          type: 'expense'
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.findMany({
        where: {
          categoryId: id,
          userId: req.user.id
        },
        orderBy: {
          date: 'desc'
        },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          date: true
        }
      })
    ])

    res.json({
      category,
      stats: {
        totalIncome: incomeStats._sum.amount || 0,
        totalExpense: expenseStats._sum.amount || 0,
        incomeCount: incomeStats._count,
        expenseCount: expenseStats._count,
        totalTransactions: incomeStats._count + expenseStats._count
      },
      recentTransactions
    })
  } catch (error) {
    console.error('获取分类统计错误:', error)
    res.status(500).json({ error: '获取分类统计失败' })
  }
})

module.exports = router