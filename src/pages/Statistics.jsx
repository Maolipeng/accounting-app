import React, { useState, useMemo } from 'react'
import { Calendar, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
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

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))]
    return years.sort((a, b) => b - a)
  }, [transactions])

  // Filter transactions based on selected period
  const periodTransactions = useMemo(() => {
    let startDate, endDate

    if (selectedPeriod === 'month') {
      startDate = startOfMonth(new Date(selectedYear, selectedMonth))
      endDate = endOfMonth(new Date(selectedYear, selectedMonth))
    } else {
      startDate = startOfYear(new Date(selectedYear, 0))
      endDate = endOfYear(new Date(selectedYear, 0))
    }

    return transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }, [transactions, selectedPeriod, selectedYear, selectedMonth])

  // Category breakdown data for pie chart
  const categoryData = useMemo(() => {
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense')
    const categoryTotals = {}

    expenseTransactions.forEach(transaction => {
      const categoryId = transaction.category
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0
      }
      categoryTotals[categoryId] += transaction.amount
    })

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId) || { 
          name: categoryId, 
          color: '#6b7280' 
        }
        return {
          name: category.name,
          value: amount,
          color: category.color
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [periodTransactions, categories])

  // Trend data for line/bar charts
  const trendData = useMemo(() => {
    if (selectedPeriod === 'month') {
      // Daily data for selected month
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth))
      const endDate = endOfMonth(new Date(selectedYear, selectedMonth))
      const days = eachDayOfInterval({ start: startDate, end: endDate })

      return days.map(day => {
        const dayTransactions = periodTransactions.filter(t => 
          format(new Date(t.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        )

        const income = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expense = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          date: format(day, 'MMM dd'),
          income,
          expense,
          net: income - expense
        }
      })
    } else {
      // Monthly data for selected year
      const startDate = startOfYear(new Date(selectedYear, 0))
      const endDate = endOfYear(new Date(selectedYear, 0))
      const months = eachMonthOfInterval({ start: startDate, end: endDate })

      return months.map(month => {
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.getFullYear() === selectedYear && 
                 transactionDate.getMonth() === month.getMonth()
        })

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          date: format(month, 'MMM'),
          income,
          expense,
          net: income - expense
        }
      })
    }
  }, [transactions, selectedPeriod, selectedYear, selectedMonth, periodTransactions])

  // Summary statistics
  const summaryStats = useMemo(() => {
    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const avgDailyExpense = selectedPeriod === 'month' 
      ? expense / new Date(selectedYear, selectedMonth + 1, 0).getDate()
      : expense / 365

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      avgDailyExpense,
      transactionCount: periodTransactions.length
    }
  }, [periodTransactions, selectedPeriod, selectedYear, selectedMonth])

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-600">分析您的财务模式和趋势</p>
        </div>

        {/* Period Controls */}
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input text-sm"
          >
            <option value="month">月度视图</option>
            <option value="year">年度视图</option>
          </select>

          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input text-sm"
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
              className="input text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {format(new Date(2023, i), 'MMMM')}
                </option>
              ))}
            </select>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易笔数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.map((category, index) => {
                  const categoryTransactions = periodTransactions.filter(
                    t => t.type === 'expense' && t.categoryName === category.name
                  )
                  const percentage = ((category.value / summaryStats.totalExpense) * 100).toFixed(1)
                  
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoryTransactions.length}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics