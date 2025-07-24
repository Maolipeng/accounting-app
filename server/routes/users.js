const express = require('express')
const { body, validationResult } = require('express-validator')
const prisma = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取用户统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id

    // 获取各种统计数据
    const [
      transactionStats,
      categoryCount,
      budgetCount,
      recentTransactions
    ] = await Promise.all([
      // 交易统计
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { amount: true },
        _count: true
      }),
      // 分类数量
      prisma.category.count({
        where: { userId }
      }),
      // 预算数量
      prisma.budget.count({
        where: { userId }
      }),
      // 最近交易
      prisma.transaction.findMany({
        where: { userId },
        include: {
          category: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 5
      })
    ])

    // 处理交易统计数据
    const incomeStats = transactionStats.find(stat => stat.type === 'income')
    const expenseStats = transactionStats.find(stat => stat.type === 'expense')

    const stats = {
      transactions: {
        totalIncome: incomeStats?._sum.amount || 0,
        totalExpense: expenseStats?._sum.amount || 0,
        incomeCount: incomeStats?._count || 0,
        expenseCount: expenseStats?._count || 0,
        balance: (incomeStats?._sum.amount || 0) - (expenseStats?._sum.amount || 0)
      },
      categories: {
        total: categoryCount
      },
      budgets: {
        total: budgetCount
      },
      recentTransactions
    }

    res.json({ stats })
  } catch (error) {
    console.error('获取用户统计错误:', error)
    res.status(500).json({ error: '获取用户统计失败' })
  }
})

// 导出用户数据
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id

    // 获取用户所有数据
    const [user, transactions, categories, budgets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true
        }
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: {
          category: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.category.findMany({
        where: { userId }
      }),
      prisma.budget.findMany({
        where: { userId }
      })
    ])

    const exportData = {
      user,
      transactions,
      categories,
      budgets,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }

    res.json({
      message: '数据导出成功',
      data: exportData
    })
  } catch (error) {
    console.error('导出用户数据错误:', error)
    res.status(500).json({ error: '导出用户数据失败' })
  }
})

// 删除用户账户
router.delete('/account', [
  body('password').notEmpty().withMessage('密码不能为空'),
  body('confirmation').equals('DELETE').withMessage('确认删除必须输入DELETE')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { password } = req.body
    const userId = req.user.id

    // 验证密码
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    const bcrypt = require('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: '密码错误' })
    }

    // 删除用户及其所有相关数据（由于设置了级联删除，会自动删除相关数据）
    await prisma.user.delete({
      where: { id: userId }
    })

    res.json({ message: '账户删除成功' })
  } catch (error) {
    console.error('删除账户错误:', error)
    res.status(500).json({ error: '删除账户失败' })
  }
})

// 获取账户活动日志（最近操作记录）
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user.id

    // 获取最近的交易记录作为活动日志
    const recentActivities = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            name: true,
            icon: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // 格式化活动记录
    const activities = recentActivities.map(transaction => ({
      id: transaction.id,
      type: 'transaction',
      action: transaction.type === 'income' ? '添加收入' : '添加支出',
      description: `${transaction.category.icon} ${transaction.category.name} - ¥${transaction.amount}`,
      details: transaction.description,
      timestamp: transaction.createdAt,
      date: transaction.date
    }))

    res.json({ activities })
  } catch (error) {
    console.error('获取活动日志错误:', error)
    res.status(500).json({ error: '获取活动日志失败' })
  }
})

module.exports = router