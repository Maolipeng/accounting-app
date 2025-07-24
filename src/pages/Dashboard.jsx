import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import TransactionForm from '../components/TransactionForm'
import RecentTransactions from '../components/RecentTransactions'
import QuickStats from '../components/QuickStats'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import apiService from '../services/api' // Import apiService

const Dashboard = () => {
  const { categories } = useTransactions()
  const [showAddForm, setShowAddForm] = useState(false)
  
  // States for selected period and custom dates (UI input)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // States for applied period and custom dates (for API call)
  const [appliedPeriod, setAppliedPeriod] = useState('month')
  const [appliedCustomStartDate, setAppliedCustomStartDate] = useState(null)
  const [appliedCustomEndDate, setAppliedCustomEndDate] = useState(null)

  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize custom dates with current month on first render
  useEffect(() => {
    const now = new Date();
    const defaultStartDate = format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultEndDate = format(endOfMonth(now), 'yyyy-MM-dd');
    setCustomStartDate(defaultStartDate);
    setCustomEndDate(defaultEndDate);
    setAppliedCustomStartDate(startOfMonth(now));
    setAppliedCustomEndDate(endOfMonth(now));
  }, []);

  const fetchTransactions = useCallback(async (period, startDate, endDate) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      let fetchStartDate, fetchEndDate;

      const now = new Date();

      switch (period) {
        case 'day':
          fetchStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          fetchEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'week':
          fetchStartDate = startOfWeek(now, { weekStartsOn: 1 });
          fetchEndDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          fetchStartDate = startOfMonth(now);
          fetchEndDate = endOfMonth(now);
          break;
        case 'custom':
          if (startDate && endDate) {
            fetchStartDate = startDate;
            fetchEndDate = endDate;
          } else {
            // Fallback for custom if dates are not properly set
            fetchStartDate = startOfMonth(now);
            fetchEndDate = endOfMonth(now);
          }
          break;
        default:
          fetchStartDate = startOfMonth(now);
          fetchEndDate = endOfMonth(now);
          break;
      }

      if (fetchStartDate) {
        params.startDate = format(fetchStartDate, 'yyyy-MM-dd');
      }
      if (fetchEndDate) {
        params.endDate = format(fetchEndDate, 'yyyy-MM-dd');
      }
      
      const response = await apiService.transactions.list(params)
      setFilteredTransactions(response.transactions)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('无法加载交易记录。')
    } finally {
      setLoading(false)
    }
  }, [])

  // Effect to trigger fetch when applied period or custom dates change
  useEffect(() => {
    fetchTransactions(appliedPeriod, appliedCustomStartDate, appliedCustomEndDate)
  }, [appliedPeriod, appliedCustomStartDate, appliedCustomEndDate, fetchTransactions])

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    // Reset custom dates if switching away from custom
    if (e.target.value !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    } else {
      // If switching to custom, ensure default dates are set for display
      const now = new Date();
      setCustomStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setCustomEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    }
  };

  const handleQuery = () => {
    setAppliedPeriod(selectedPeriod);
    if (selectedPeriod === 'custom') {
      setAppliedCustomStartDate(customStartDate ? parseISO(customStartDate) : null);
      setAppliedCustomEndDate(customEndDate ? parseISO(customEndDate) : null);
    } else {
      setAppliedCustomStartDate(null);
      setAppliedCustomEndDate(null);
    }
  };

  // Calculate summary statistics based on filteredTransactions
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      income,
      expense,
      balance: income - expense,
      transactionCount: filteredTransactions.length
    }
  }, [filteredTransactions])

  const periodLabels = {
    day: '今日',
    week: '本周',
    month: '本月',
    custom: '自定义'
  }

  const displayPeriodLabel = appliedPeriod === 'custom' && appliedCustomStartDate && appliedCustomEndDate
    ? `${format(appliedCustomStartDate, 'yyyy-MM-dd')} 至 ${format(appliedCustomEndDate, 'yyyy-MM-dd')}`
    : periodLabels[appliedPeriod];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600">欢迎回来！以下是您的财务概览。</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center space-x-3 space-y-2 sm:space-y-0">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="input text-sm"
          >
            <option value="day">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="custom">自定义</option>
          </select>

          {selectedPeriod === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input text-sm"
              />
            </>
          )}
          
          <button
            onClick={handleQuery}
            className="btn btn-secondary px-4 py-2 flex items-center space-x-2"
          >
            查询
          </button>

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

      {loading && <p>加载中...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Income Card */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{displayPeriodLabel}收入</p>
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
                  <p className="text-sm font-medium text-gray-600">{displayPeriodLabel}支出</p>
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
                  <p className="text-sm font-medium text-gray-600">{displayPeriodLabel}结余</p>
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
                  <p className="text-sm font-medium text-gray-600">{displayPeriodLabel}笔数</p>
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
              <QuickStats transactions={filteredTransactions} categories={categories} />
            </div>

            {/* 最近交易 */}
            <div className="lg:col-span-2">
              <RecentTransactions 
                transactions={filteredTransactions.slice(0, 10)} 
                categories={categories}
                showAddButton={false}
              />
            </div>
          </div>
        </>
      )}

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
