import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Download } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import { useStorage } from '../context/StorageContext'
import TransactionForm from '../components/TransactionForm'
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

const Transactions = () => {
  const { transactions, categories, filters, dispatch } = useTransactions()
  const { exportToCSV } = useStorage()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let startDate, endDate

      switch (filters.dateRange) {
        case 'day':
          startDate = startOfDay(now)
          endDate = endOfDay(now)
          break
        case 'week':
          startDate = startOfWeek(now)
          endDate = endOfWeek(now)
          break
        case 'month':
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate)
            endDate = new Date(filters.endDate)
          }
          break
        default:
          startDate = null
          endDate = null
      }

      if (startDate && endDate) {
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date)
          return isWithinInterval(transactionDate, { start: startDate, end: endDate })
        })
      }
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.note?.toLowerCase().includes(searchLower) ||
        t.categoryName?.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower)
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, filters])

  const handleFilterChange = (key, value) => {
    dispatch({ type: 'SET_FILTERS', payload: { [key]: value } })
  }

  const handleDelete = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId })
    }
  }

  const handleExport = () => {
    exportToCSV(filteredTransactions)
  }

  const getCategoryData = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { 
      name: categoryId, 
      icon: '📝', 
      color: '#6b7280' 
    }
  }

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">交易记录</h1>
          <p className="text-gray-600">管理您的所有收入和支出记录</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="btn btn-secondary px-4 py-2 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>导出</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary px-4 py-2 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>添加交易</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">总收入</p>
            <p className="text-2xl font-bold text-success-600">¥{totalIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">总支出</p>
            <p className="text-2xl font-bold text-danger-600">¥{totalExpense.toLocaleString()}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">净余额</p>
            <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              ¥{(totalIncome - totalExpense).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索交易..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>筛选</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input text-sm"
              >
                <option value="all">所有类型</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input text-sm"
              >
                <option value="all">所有分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="input text-sm"
              >
                <option value="all">所有时间</option>
                <option value="day">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="custom">自定义范围</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => dispatch({ 
                  type: 'SET_FILTERS', 
                  payload: { 
                    type: 'all', 
                    category: 'all', 
                    dateRange: 'all', 
                    searchTerm: '' 
                  } 
                })}
                className="btn btn-secondary text-sm w-full"
              >
                清除筛选
              </button>
            </div>
          </div>
        )}

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            交易记录 ({filteredTransactions.length})
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到交易记录</h3>
            <p className="text-gray-600 mb-4">
              {filters.searchTerm || filters.type !== 'all' || filters.category !== 'all' || filters.dateRange !== 'all'
                ? '尝试调整筛选条件或搜索关键词'
                : '开始添加您的第一笔交易'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => {
              const category = getCategoryData(transaction.category)
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* Category Icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>

                    {/* Transaction Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'income'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-danger-100 text-danger-700'
                          }`}
                        >
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        {transaction.note && (
                          <span className="ml-2">• {transaction.note}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Amount */}
                    <span
                      className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit transaction"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <TransactionForm
              onClose={() => setShowAddForm(false)}
              categories={categories}
            />
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="modal-overlay" onClick={() => setEditingTransaction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <TransactionForm
              transaction={editingTransaction}
              onClose={() => setEditingTransaction(null)}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions