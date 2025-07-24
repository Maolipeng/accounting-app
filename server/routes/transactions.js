const express = require('express')
const { body, query, validationResult } = require('express-validator')
const prisma = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取交易记录列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('type').optional().isIn(['income', 'expense']).withMessage('类型必须是income或expense'),
  query('categoryId').optional().isString().withMessage('分类ID必须是字符串'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '参数验证失败', details: errors.array() })
    }

    const {
      page = 1,
      limit = 20,
      type,
      categoryId,
      startDate,
      endDate,
      search
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // 构建查询条件
    const where = {
      userId: req.user.id
    }

    if (type) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // 获取交易记录
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take
      }),
      prisma.transaction.count({ where })
    ])

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('获取交易记录错误:', error)
    res.status(500).json({ error: '获取交易记录失败' })
  }
})

// 获取单个交易记录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({ error: '交易记录不存在' })
    }

    res.json({ transaction })
  } catch (error) {
    console.error('获取交易记录错误:', error)
    res.status(500).json({ error: '获取交易记录失败' })
  }
})

// 创建交易记录
router.post('/', [
  body('amount').isFloat({ min: 0.01 }).withMessage('金额必须大于0'),
  body('type').isIn(['income', 'expense']).withMessage('类型必须是income或expense'),
  body('categoryId').notEmpty().withMessage('分类不能为空'),
  body('date').isISO8601().withMessage('日期格式不正确'),
  body('description').optional().isString().withMessage('描述必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { amount, type, categoryId, date, description } = req.body

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

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        categoryId,
        date: new Date(date),
        description: description || null,
        userId: req.user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    res.status(201).json({
      message: '交易记录创建成功',
      transaction
    })
  } catch (error) {
    console.error('创建交易记录错误:', error)
    res.status(500).json({ error: '创建交易记录失败' })
  }
})

// 更新交易记录
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('金额必须大于0'),
  body('type').optional().isIn(['income', 'expense']).withMessage('类型必须是income或expense'),
  body('categoryId').optional().notEmpty().withMessage('分类不能为空'),
  body('date').optional().isISO8601().withMessage('日期格式不正确'),
  body('description').optional().isString().withMessage('描述必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '数据验证失败', details: errors.array() })
    }

    const { id } = req.params
    const { amount, type, categoryId, date, description } = req.body

    // 检查交易记录是否存在且属于当前用户
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingTransaction) {
      return res.status(404).json({ error: '交易记录不存在' })
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

    const updateData = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (type) updateData.type = type
    if (categoryId) updateData.categoryId = categoryId
    if (date) updateData.date = new Date(date)
    if (description !== undefined) updateData.description = description || null

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    res.json({
      message: '交易记录更新成功',
      transaction
    })
  } catch (error) {
    console.error('更新交易记录错误:', error)
    res.status(500).json({ error: '更新交易记录失败' })
  }
})

// 删除交易记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 检查交易记录是否存在且属于当前用户
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingTransaction) {
      return res.status(404).json({ error: '交易记录不存在' })
    }

    await prisma.transaction.delete({
      where: { id }
    })

    res.json({ message: '交易记录删除成功' })
  } catch (error) {
    console.error('删除交易记录错误:', error)
    res.status(500).json({ error: '删除交易记录失败' })
  }
})

// 获取统计数据
router.get('/stats/summary', [
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '参数验证失败', details: errors.array() })
    }

    const { startDate, endDate } = req.query

    const where = {
      userId: req.user.id
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // 获取收入和支出统计
    const [incomeStats, expenseStats] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
        _count: true
      })
    ])

    // 按分类统计
    const categoryStats = await prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      _count: true
    })

    // 获取分类信息
    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      select: { id: true, name: true, icon: true, color: true }
    })

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat
      return acc
    }, {})

    const categoryStatsWithInfo = categoryStats.map(stat => ({
      ...stat,
      category: categoryMap[stat.categoryId]
    }))

    res.json({
      summary: {
        totalIncome: incomeStats._sum.amount || 0,
        totalExpense: expenseStats._sum.amount || 0,
        balance: (incomeStats._sum.amount || 0) - (expenseStats._sum.amount || 0),
        incomeCount: incomeStats._count,
        expenseCount: expenseStats._count
      },
      categoryStats: categoryStatsWithInfo
    })
  } catch (error) {
    console.error('获取统计数据错误:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

// 获取趋势数据
router.get('/stats/trend', [
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  query('interval').optional().isIn(['day', 'month']).withMessage('间隔必须是day或month')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '参数验证失败', details: errors.array() })
    }

    const { startDate, endDate, interval = 'day' } = req.query

    const where = {
      userId: req.user.id
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // 获取所有符合条件的交易
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        amount: true,
        type: true,
        date: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // 按日期分组
    const trendData = {}
    
    transactions.forEach(transaction => {
      let dateKey
      
      if (interval === 'day') {
        // 按天分组，格式为 YYYY-MM-DD
        dateKey = transaction.date.toISOString().split('T')[0]
      } else {
        // 按月分组，格式为 YYYY-MM
        const year = transaction.date.getFullYear()
        const month = String(transaction.date.getMonth() + 1).padStart(2, '0')
        dateKey = `${year}-${month}`
      }
      
      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          date: dateKey,
          income: 0,
          expense: 0
        }
      }
      
      if (transaction.type === 'income') {
        trendData[dateKey].income += transaction.amount
      } else {
        trendData[dateKey].expense += transaction.amount
      }
    })
    
    // 计算净值并转换为数组
    const result = Object.values(trendData).map(item => ({
      ...item,
      net: item.income - item.expense,
      // 格式化日期显示
      date: interval === 'day' 
        ? new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        : new Date(`${item.date}-01`).toLocaleDateString('zh-CN', { month: 'short' })
    }))
    
    res.json({
      data: result
    })
  } catch (error) {
    console.error('获取趋势数据错误:', error)
    res.status(500).json({ error: '获取趋势数据失败' })
  }
})

module.exports = router