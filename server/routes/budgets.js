const express = require('express')
const { body, query, validationResult } = require('express-validator')
const prisma = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取用户的所有预算
router.get('/', [
  query('period').optional().isIn(['monthly', 'yearly']).withMessage('周期必须是monthly或yearly')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '参数验证失败', details: errors.array() })
    }

    const { period } = req.query

    const where = {
      userId: req.user.id
    }

    if (period) {
      where.period = period
    }

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: {
        startDate: 'desc'
      }
    })

    // 获取每个预算的使用情况
    const budgetsWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            userId: req.user.id,
            type: 'expense',
            date: {
              gte: budget.startDate,
              lte: budget.endDate
            }
          },
          _sum: { amount: true }
        })

        return {
          ...budget,
          spent: spent._sum.amount || 0,
          remaining: budget.amount - (spent._sum.amount || 0),
          percentage: budget.amount > 0 ? ((spent._sum.amount || 0) / budget.amount) * 100 : 0
        }
      })
    )

    res.json({ budgets: budgetsWithUsage })
  } catch (error) {
    console.error('获取预算错误:', error)
    res.status(500).json({ error: '获取预算失败' })
  }
})

// 获取单个预算
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!budget) {
      return res.status(404).json({ error: '预算不存在' })
    }

    // 获取预算使用情况
    const [spent, transactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          categoryId: budget.categoryId,
          userId: req.user.id,
          type: 'expense',
          date: {
            gte: budget.startDate,
            lte: budget.endDate
          }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        where: {
          categoryId: budget.categoryId,
          userId: req.user.id,
          type: 'expense',
          date: {
            gte: budget.startDate,
            lte: budget.endDate
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 10,
        select: {
          id: true,
          amount: true,
          description: true,
          date: true
        }
      })
    ])

    const budgetWithUsage = {
      ...budget,
      spent: spent._sum.amount || 0,
      remaining: budget.amount - (spent._sum.amount || 0),
      percentage: budget.amount > 0 ? ((spent._sum.amount || 0) / budget.amount) * 100 : 0,
      transactions
    }

    res.json({ budget: budgetWithUsage })
  } catch (error) {
    console.error('获取预算错误:', error)
    res.status(500).json({ error: '获取预算失败' })
  }
})

// 创建新预算
router.post('/', [
  body('categoryId').notEmpty().withMessage('分类不能为空'),
  body('amount').isFloat({ min: 0.01 }).withMessage('预算金额必须大于0'),
  body('period').isIn(['monthly', 'yearly']).withMessage('周期必须是monthly或yearly'),
  body('startDate').isISO8601().withMessage('开始日期格式不正确'),
  body('endDate').isISO8601().withMessage('结束日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { categoryId, amount, period, startDate, endDate } = req.body

    // 验证分类是否属于当前用户
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.user.id
      }
    })

    if (!category) {
      return res.status(400).json({ error: '分类不存在或无权限' })
    }

    // 验证日期范围
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return res.status(400).json({ error: '结束日期必须晚于开始日期' })
    }

    // 检查是否已存在重叠的预算
    const overlappingBudget = await prisma.budget.findFirst({
      where: {
        categoryId,
        userId: req.user.id,
        OR: [
          {
            startDate: {
              lte: end
            },
            endDate: {
              gte: start
            }
          }
        ]
      }
    })

    if (overlappingBudget) {
      return res.status(400).json({ error: '该分类在此时间段已存在预算' })
    }

    const budget = await prisma.budget.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        period,
        startDate: start,
        endDate: end,
        userId: req.user.id
      }
    })

    res.status(201).json({
      message: '预算创建成功',
      budget
    })
  } catch (error) {
    console.error('创建预算错误:', error)
    res.status(500).json({ error: '创建预算失败' })
  }
})

// 更新预算
router.put('/:id', [
  body('categoryId').optional().notEmpty().withMessage('分类不能为空'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('预算金额必须大于0'),
  body('period').optional().isIn(['monthly', 'yearly']).withMessage('周期必须是monthly或yearly'),
  body('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  body('endDate').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { id } = req.params
    const { categoryId, amount, period, startDate, endDate } = req.body

    // 检查预算是否存在且属于当前用户
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingBudget) {
      return res.status(404).json({ error: '预算不存在' })
    }

    // 如果更新分类，验证分类是否属于当前用户
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.user.id
        }
      })

      if (!category) {
        return res.status(400).json({ error: '分类不存在或无权限' })
      }
    }

    // 验证日期范围
    const start = startDate ? new Date(startDate) : existingBudget.startDate
    const end = endDate ? new Date(endDate) : existingBudget.endDate

    if (start >= end) {
      return res.status(400).json({ error: '结束日期必须晚于开始日期' })
    }

    // 检查是否与其他预算重叠
    if (categoryId || startDate || endDate) {
      const checkCategoryId = categoryId || existingBudget.categoryId
      
      const overlappingBudget = await prisma.budget.findFirst({
        where: {
          categoryId: checkCategoryId,
          userId: req.user.id,
          NOT: { id },
          OR: [
            {
              startDate: {
                lte: end
              },
              endDate: {
                gte: start
              }
            }
          ]
        }
      })

      if (overlappingBudget) {
        return res.status(400).json({ error: '该分类在此时间段已存在预算' })
      }
    }

    const updateData = {}
    if (categoryId) updateData.categoryId = categoryId
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (period) updateData.period = period
    if (startDate) updateData.startDate = start
    if (endDate) updateData.endDate = end

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData
    })

    res.json({
      message: '预算更新成功',
      budget
    })
  } catch (error) {
    console.error('更新预算错误:', error)
    res.status(500).json({ error: '更新预算失败' })
  }
})

// 删除预算
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 检查预算是否存在且属于当前用户
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingBudget) {
      return res.status(404).json({ error: '预算不存在' })
    }

    await prisma.budget.delete({
      where: { id }
    })

    res.json({ message: '预算删除成功' })
  } catch (error) {
    console.error('删除预算错误:', error)
    res.status(500).json({ error: '删除预算失败' })
  }
})

// 获取预算概览
router.get('/overview/summary', async (req, res) => {
  try {
    const currentDate = new Date()
    
    // 获取当前有效的预算
    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId: req.user.id,
        startDate: {
          lte: currentDate
        },
        endDate: {
          gte: currentDate
        }
      }
    })

    // 计算每个预算的使用情况
    const budgetSummary = await Promise.all(
      activeBudgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            userId: req.user.id,
            type: 'expense',
            date: {
              gte: budget.startDate,
              lte: budget.endDate
            }
          },
          _sum: { amount: true }
        })

        const spentAmount = spent._sum.amount || 0
        const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0

        return {
          ...budget,
          spent: spentAmount,
          remaining: budget.amount - spentAmount,
          percentage,
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'normal'
        }
      })
    )

    // 统计概览
    const totalBudget = budgetSummary.reduce((sum, budget) => sum + budget.amount, 0)
    const totalSpent = budgetSummary.reduce((sum, budget) => sum + budget.spent, 0)
    const exceededCount = budgetSummary.filter(budget => budget.status === 'exceeded').length
    const warningCount = budgetSummary.filter(budget => budget.status === 'warning').length

    res.json({
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        overallPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        activeBudgetsCount: activeBudgets.length,
        exceededCount,
        warningCount
      },
      budgets: budgetSummary
    })
  } catch (error) {
    console.error('获取预算概览错误:', error)
    res.status(500).json({ error: '获取预算概览失败' })
  }
})

module.exports = router