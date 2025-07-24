import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, PieChart as PieChartIcon, CalendarRange } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import api from '../services/api'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns'

const Statistics = () => {
  const { transactions, categories } = useTransactions()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  console.log('showCustomDateRange:', showCustomDateRange) // 添加调试日志
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 当月第一天
    endDate: new Date().toISOString().split('T')[0] // 今天
  })

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))]
    return years.sort((a, b) => b - a)
  }, [transactions])

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [periodTransactions, setPeriodTransactions] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  // 连接状态
  const [connectionError, setConnectionError] = useState(false)

  // 获取交易数据
  const fetchTransactionData = useCallback(async () => {
    let startDate, endDate

    if (showCustomDateRange) {
      startDate = customDateRange.startDate
      endDate = customDateRange.endDate
    } else if (selectedPeriod === 'month') {
      startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
    } else {
      startDate = format(startOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
      endDate = format(endOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
    }

    try {
      setIsLoadingData(true)
      setConnectionError(false)
      const response = await api.transactions.list({
        page: currentPage,
        limit: pageSize,
        startDate,
        endDate
      })
      
      setPeriodTransactions(response.transactions)
      setTotalItems(response.pagination.total)
      setTotalPages(response.pagination.pages)
    } catch (error) {
      console.error('获取交易数据失败:', error)
      // 检查是否为连接错误
      if (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network Error') ||
        error.message.includes('ECONNREFUSED')
      )) {
        setConnectionError(true)
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [selectedPeriod, selectedYear, selectedMonth, showCustomDateRange, customDateRange, currentPage, pageSize])

  // 当筛选条件或分页变化时获取数据
  useEffect(() => {
    fetchTransactionData()
  }, [fetchTransactionData])

  // 获取分类统计数据
  const [categoryData, setCategoryData] = useState([])
  const [isLoadingCategoryData, setIsLoadingCategoryData] = useState(false)

  const fetchCategoryData = useCallback(async () => {
    let startDate, endDate

    if (showCustomDateRange) {
      startDate = customDateRange.startDate
      endDate = customDateRange.endDate
    } else if (selectedPeriod === 'month') {
      startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
    } else {
      startDate = format(startOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
      endDate = format(endOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
    }

    try {
      setIsLoadingCategoryData(true)
      setConnectionError(false)
      const response = await api.transactions.getStats({
        startDate,
        endDate
      })
      
      // 处理分类统计数据
      const expenseCategories = response.categoryStats
        .filter(stat => stat.type === 'expense')
        .map(stat => ({
          id: stat.categoryId,
          name: stat.category?.name || '未分类',
          value: stat._sum.amount,
          color: stat.category?.color || '#6b7280'
        }))
        .sort((a, b) => b.value - a.value)
      
      setCategoryData(expenseCategories)
    } catch (error) {
      console.error('获取分类统计数据失败:', error)
      if (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network Error') ||
        error.message.includes('ECONNREFUSED')
      )) {
        setConnectionError(true)
      }
    } finally {
      setIsLoadingCategoryData(false)
    }
  }, [selectedPeriod, selectedYear, selectedMonth, showCustomDateRange, customDateRange])

  // 当筛选条件变化时获取分类数据
  useEffect(() => {
    fetchCategoryData()
  }, [fetchCategoryData])

  // 获取趋势数据
  const [trendData, setTrendData] = useState([])
  const [isLoadingTrendData, setIsLoadingTrendData] = useState(false)

  const fetchTrendData = useCallback(async () => {
    let startDate, endDate, interval

    if (selectedPeriod === 'month') {
      startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      interval = 'day'
    } else {
      startDate = format(startOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
      endDate = format(endOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
      interval = 'month'
    }

    if (showCustomDateRange) {
      startDate = customDateRange.startDate
      endDate = customDateRange.endDate
      // 根据日期范围长度决定间隔
      const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      interval = days > 60 ? 'month' : 'day'
    }

    try {
      setIsLoadingTrendData(true)
      setConnectionError(false)
      
      // 使用趋势数据接口
      const response = await api.transactions.getTrend({
        startDate,
        endDate,
        interval
      })
      
      setTrendData(response.data || [])
    } catch (error) {
      console.error('获取趋势数据失败:', error)
      
      if (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network Error') ||
        error.message.includes('ECONNREFUSED')
      )) {
        setConnectionError(true)
      }
      
      // 如果后端没有提供趋势接口或连接失败，使用以下备用方案
      // 生成日期间隔
      let datePoints = []
      if (interval === 'day') {
        const start = new Date(startDate)
        const end = new Date(endDate)
        datePoints = eachDayOfInterval({ start, end }).map(day => format(day, 'yyyy-MM-dd'))
      } else {
        const start = new Date(startDate)
        const end = new Date(endDate)
        datePoints = eachMonthOfInterval({ start, end }).map(month => format(month, 'yyyy-MM'))
      }
      
      // 使用空数据初始化
      const emptyTrendData = datePoints.map(date => ({
        date: interval === 'day' ? format(new Date(date), 'MMM dd') : format(new Date(date + '-01'), 'MMM'),
        income: 0,
        expense: 0,
        net: 0
      }))
      
      setTrendData(emptyTrendData)
    } finally {
      setIsLoadingTrendData(false)
    }
  }, [selectedPeriod, selectedYear, selectedMonth, showCustomDateRange, customDateRange])

  // 当筛选条件变化时获取趋势数据
  useEffect(() => {
    fetchTrendData()
  }, [fetchTrendData])

  // 获取汇总统计数据
  const [summaryStats, setSummaryStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    avgDailyExpense: 0,
    transactionCount: 0
  })
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)

  const fetchSummaryStats = useCallback(async () => {
    let startDate, endDate

    if (showCustomDateRange) {
      startDate = customDateRange.startDate
      endDate = customDateRange.endDate
    } else if (selectedPeriod === 'month') {
      startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
    } else {
      startDate = format(startOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
      endDate = format(endOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
    }

    try {
      setIsLoadingSummary(true)
      setConnectionError(false)
      const response = await api.transactions.getStats({
        startDate,
        endDate
      })
      
      const income = response.summary.totalIncome || 0
      const expense = response.summary.totalExpense || 0
      
      // 计算平均日支出
      const days = selectedPeriod === 'month' 
        ? new Date(selectedYear, selectedMonth + 1, 0).getDate()
        : 365
      
      setSummaryStats({
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense,
        avgDailyExpense: expense / days,
        transactionCount: response.summary.incomeCount + response.summary.expenseCount
      })
    } catch (error) {
      console.error('获取汇总统计数据失败:', error)
      if (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network Error') ||
        error.message.includes('ECONNREFUSED')
      )) {
        setConnectionError(true)
      }
    } finally {
      setIsLoadingSummary(false)
    }
  }, [selectedPeriod, selectedYear, selectedMonth, showCustomDateRange, customDateRange])

  // 当筛选条件变化时获取汇总数据
  useEffect(() => {
    fetchSummaryStats()
  }, [fetchSummaryStats])

  // 当连接错误时，使用本地数据（从TransactionContext）
  useEffect(() => {
    if (connectionError && transactions.length > 0) {
      console.log('使用本地数据作为后备方案')
      
      // 根据选定的日期范围过滤交易
      let startDate, endDate
      if (showCustomDateRange) {
        startDate = new Date(customDateRange.startDate)
        endDate = new Date(customDateRange.endDate)
        endDate.setHours(23, 59, 59, 999)
      } else if (selectedPeriod === 'month') {
        startDate = startOfMonth(new Date(selectedYear, selectedMonth))
        endDate = endOfMonth(new Date(selectedYear, selectedMonth))
      } else {
        startDate = startOfYear(new Date(selectedYear, 0))
        endDate = endOfYear(new Date(selectedYear, 0))
      }

      // 过滤交易
      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= startDate && transactionDate <= endDate
      })

      // 设置分页数据
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      setPeriodTransactions(filteredTransactions.slice(start, end))
      setTotalItems(filteredTransactions.length)
      setTotalPages(Math.ceil(filteredTransactions.length / pageSize))

      // 计算汇总统计
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const days = selectedPeriod === 'month' 
        ? new Date(selectedYear, selectedMonth + 1, 0).getDate()
        : 365
      
      setSummaryStats({
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense,
        avgDailyExpense: expense / days,
        transactionCount: filteredTransactions.length
      })

      // 计算分类数据
      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense')
      const categoryTotals = {}

      expenseTransactions.forEach(transaction => {
        const categoryId = transaction.category?.id || transaction.categoryId
        if (!categoryId) return
        
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = 0
        }
        categoryTotals[categoryId] += transaction.amount
      })

      const localCategoryData = Object.entries(categoryTotals)
        .map(([categoryId, amount]) => {
          const transactionWithCategory = expenseTransactions.find(t => 
            (t.category?.id === categoryId) || (t.categoryId === categoryId)
          )
          
          if (transactionWithCategory?.category) {
            const cat = transactionWithCategory.category
            return {
              id: categoryId,
              name: cat.name || '未分类',
              value: amount,
              color: cat.color || '#6b7280'
            }
          }
          
          const category = categories.find(c => c.id === categoryId) || { 
            name: '未分类', 
            color: '#6b7280' 
          }
          
          return {
            id: categoryId,
            name: category.name,
            value: amount,
            color: category.color || '#6b7280'
          }
        })
        .sort((a, b) => b.value - a.value)

      setCategoryData(localCategoryData)

      // 计算趋势数据
      let interval = selectedPeriod === 'month' ? 'day' : 'month'
      if (showCustomDateRange) {
        const days = (endDate - startDate) / (1000 * 60 * 60 * 24)
        interval = days > 60 ? 'month' : 'day'
      }

      const trendDataMap = {}
      
      filteredTransactions.forEach(transaction => {
        let dateKey
        const transactionDate = new Date(transaction.date)
        
        if (interval === 'day') {
          dateKey = format(transactionDate, 'yyyy-MM-dd')
        } else {
          dateKey = format(transactionDate, 'yyyy-MM')
        }
        
        if (!trendDataMap[dateKey]) {
          trendDataMap[dateKey] = {
            date: interval === 'day' 
              ? format(transactionDate, 'MMM dd')
              : format(transactionDate, 'MMM'),
            income: 0,
            expense: 0,
            net: 0
          }
        }
        
        if (transaction.type === 'income') {
          trendDataMap[dateKey].income += transaction.amount
        } else {
          trendDataMap[dateKey].expense += transaction.amount
        }
        
        trendDataMap[dateKey].net = trendDataMap[dateKey].income - trendDataMap[dateKey].expense
      })
      
      setTrendData(Object.values(trendDataMap))
    }
  }, [connectionError, transactions, categories, selectedPeriod, selectedYear, selectedMonth, 
      showCustomDateRange, customDateRange, currentPage, pageSize])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'income' ? 'Income' : 
               entry.dataKey === 'expense' ? 'Expense' : 'Net'}: 
              ¥{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* 连接错误提示 */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">无法连接到服务器</h3>
              <div className="mt-2 text-sm">
                <p>请确保后端服务器正在运行。您可以通过以下步骤检查：</p>
                <ol className="list-decimal list-inside mt-1 ml-2">
                  <li>确认服务器是否已启动（运行 <code className="bg-gray-100 px-1 rounded">npm run server</code>）</li>
                  <li>检查服务器是否在端口 5001 上运行</li>
                  <li>检查网络连接是否正常</li>
                </ol>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    fetchTransactionData()
                    fetchCategoryData()
                    fetchTrendData()
                    fetchSummaryStats()
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  重试连接
                </button>
                <div className="text-sm text-gray-600">
                  <p>启动服务器命令: <code className="bg-gray-100 px-1 rounded">cd server && npm start</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-600">分析您的财务模式和趋势</p>
        </div>

        {/* Period Controls */}
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {/* 切换按钮 */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => {
                console.log('点击预设日期');
                setShowCustomDateRange(false);
              }}
              className={`px-3 py-2 text-sm whitespace-nowrap ${
                !showCustomDateRange 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'bg-white text-gray-700'
              }`}
            >
              预设日期
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('点击自定义日期');
                setShowCustomDateRange(true);
              }}
              className={`px-3 py-2 text-sm whitespace-nowrap ${
                showCustomDateRange 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'bg-white text-gray-700'
              }`}
            >
              自定义日期
            </button>
          </div>
          
          {/* 预设日期控件 */}
          {!showCustomDateRange && (
            <>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input text-sm w-[110px]"
              >
                <option value="month">月度视图</option>
                <option value="year">年度视图</option>
              </select>

              {availableYears.length > 0 && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="input text-sm w-[80px]"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}

              {selectedPeriod === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="input text-sm w-[70px]"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1}月
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          
          {/* 自定义日期控件 */}
          {showCustomDateRange && (
            <div className="flex flex-nowrap items-center space-x-2">
              <input 
                type="date" 
                value={customDateRange.startDate} 
                onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                className="input text-sm py-1.5 w-auto"
              />
              <span className="text-gray-500 whitespace-nowrap">至</span>
              <input 
                type="date" 
                value={customDateRange.endDate} 
                onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                className="input text-sm py-1.5 w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总收入</p>
              <p className="text-xl font-bold text-success-600">
                ¥{summaryStats.totalIncome.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总支出</p>
              <p className="text-xl font-bold text-danger-600">
                ¥{summaryStats.totalExpense.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-danger-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">净余额</p>
              <p className={`text-xl font-bold ${summaryStats.netBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ¥{summaryStats.netBalance.toLocaleString()}
              </p>
            </div>
            <Calendar className={`h-8 w-8 ${summaryStats.netBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均日支出</p>
              <p className="text-xl font-bold text-primary-600">
                ¥{summaryStats.avgDailyExpense.toLocaleString()}
              </p>
            </div>
            <PieChartIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">交易笔数</p>
              <p className="text-xl font-bold text-gray-900">
                {summaryStats.transactionCount}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            收入与支出趋势
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            分类支出
          </h3>
          {categoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`¥${value.toLocaleString()}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无支出数据</p>
              </div>
            </div>
          )}
        </div>

        {/* Net Balance Trend */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            净余额趋势
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Net Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Details Table */}
      {categoryData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            分类明细详情
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    百分比
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.map((category, index) => {
                  const percentage = summaryStats.totalExpense > 0 
                    ? ((category.value / summaryStats.totalExpense) * 100).toFixed(1) 
                    : '0.0';
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{category.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {percentage}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              上一页
            </button>
            
            <span className="text-sm text-gray-600">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics