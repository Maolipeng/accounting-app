import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const QuickStats = ({ transactions, categories }) => {
  // Calculate category-wise expense breakdown
  const categoryStats = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense')
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
          icon: '📝', 
          color: '#6b7280' 
        }
        return {
          name: category.name,
          value: amount,
          color: category.color,
          icon: category.icon
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 categories
  }, [transactions, categories])

  const totalExpense = categoryStats.reduce((sum, cat) => sum + cat.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{data.icon}</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm text-gray-600">
            ¥{data.value.toLocaleString()} ({((data.value / totalExpense) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (categoryStats.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">支出明细</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">暂无支出数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
      
      {/* Pie Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryStats}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {categoryStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {categoryStats.map((category, index) => {
          const percentage = ((category.value / totalExpense) * 100).toFixed(1)
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  ¥{category.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">总支出</span>
          <span className="font-bold text-danger-600">
            ¥{totalExpense.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default QuickStats