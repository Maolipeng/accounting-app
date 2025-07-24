import React, { useState, useMemo } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import TransactionForm from '../components/TransactionForm'
import RecentTransactions from '../components/RecentTransactions'
import QuickStats from '../components/QuickStats'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

const Dashboard = () => {
  const { transactions, categories } = useTransactions()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Calculate current period transactions
  const currentPeriodTransactions = useMemo(() => {
    const now = new Date()
    let startDate, endDate

    switch (selectedPeriod) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        break
      case 'week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return isWithinInterval(transactionDate, { start: startDate, end: endDate })
    })
  }, [transactions, selectedPeriod])

  // Calculate summary statistics
  const stats = useMemo(() => {
    const income = currentPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      income,
      expense,
      balance: income - expense,
      transactionCount: currentPeriodTransactions.length
    }
  }, [currentPeriodTransactions])

  const periodLabels = {
    day: '今日',
    week: '本周',
    month: '本月'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600">欢迎回来！以下是您的财务概览。</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input text-sm"
          >
            <option value="day">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
          
          {/* Add Transaction Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary px-4 py-2 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>添加交易</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{periodLabels[selectedPeriod]}收入</p>
              <p className="text-2xl font-bold text-green-600">
                ¥{stats.income.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{periodLabels[selectedPeriod]}支出</p>
              <p className="text-2xl font-bold text-red-600">
                ¥{stats.expense.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{periodLabels[selectedPeriod]}结余</p>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ¥{stats.balance.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-6 w-6 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        {/* Transaction Count Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{periodLabels[selectedPeriod]}笔数</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.transactionCount}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats Component */}
        <div className="lg:col-span-1">
          <QuickStats transactions={currentPeriodTransactions} categories={categories} />
        </div>

        {/* 最近交易 */}
        <div className="lg:col-span-2">
          <RecentTransactions 
            transactions={transactions.slice(0, 10)} 
            categories={categories}
            showAddButton={false}
          />
        </div>
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
    </div>
  )
}

export default Dashboard