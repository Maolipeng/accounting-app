import React, { createContext, useContext, useState } from 'react'

const StorageContext = createContext()

// 预定义的AI分析提示和回复
const AI_INSIGHTS = {
  highExpense: {
    condition: (data, category) => {
      const totalExpense = data.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const categoryExpense = data.transactions
        .filter(t => t.type === 'expense' && t.category === category.id)
        .reduce((sum, t) => sum + t.amount, 0)
      
      return categoryExpense > (totalExpense * 0.4) // 如果某类支出超过总支出的40%
    },
    message: (category) => `我注意到您在${category.name}类别上的支出相对较高。考虑设置一个预算来控制这方面的支出。`
  },
  budgetExceeded: {
    condition: (data, budget) => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const monthlyExpense = data.transactions
        .filter(t => {
          const date = new Date(t.date)
          return t.type === 'expense' && 
                 (budget.category === 'all' || t.category === budget.category) &&
                 date.getMonth() === currentMonth &&
                 date.getFullYear() === currentYear
        })
        .reduce((sum, t) => sum + t.amount, 0)
      
      return monthlyExpense > budget.amount
    },
    message: (budget) => `您已经超出了"${budget.name}"预算。建议审查相关支出并调整消费习惯。`
  },
  savingOpportunity: {
    condition: (data) => {
      const income = data.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expense = data.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      return (income - expense) > (income * 0.2) // 如果结余超过收入的20%
    },
    message: () => `您有不错的结余！考虑将一部分资金用于投资或储蓄，以实现长期财务增长。`
  },
  inconsistentSaving: {
    condition: (data) => {
      // 检查最近三个月的储蓄情况是否不稳定
      const months = {}
      
      data.transactions.forEach(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        
        if (!months[monthKey]) {
          months[monthKey] = { income: 0, expense: 0 }
        }
        
        if (t.type === 'income') {
          months[monthKey].income += t.amount
        } else {
          months[monthKey].expense += t.amount
        }
      })
      
      const savings = Object.values(months).map(m => m.income - m.expense)
      if (savings.length < 2) return false
      
      // 检查储蓄率的波动
      let inconsistent = false
      for (let i = 1; i < savings.length; i++) {
        if (Math.abs(savings[i] - savings[i-1]) > (savings[i-1] * 0.5)) {
          inconsistent = true
          break
        }
      }
      
      return inconsistent
    },
    message: () => `您的月度储蓄率波动较大。尝试建立一个更稳定的预算计划，以保持一致的储蓄习惯。`
  },
  noCategories: {
    condition: (data) => data.categories.length <= 5,
    message: () => `添加更多自定义分类可以帮助您更好地追踪和分析支出模式。`
  },
  noBudgets: {
    condition: (data) => data.budgets.length === 0,
    message: () => `设置预算是控制支出和实现财务目标的有效方法。考虑为主要支出类别创建预算。`
  }
}

const STORAGE_KEY = 'accounting_app_data'

export function StorageProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle', 'syncing', 'success', 'error'

  // Local Storage Functions
  const saveToLocal = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        lastModified: new Date().toISOString()
      }))
      return true
    } catch (error) {
      console.error('Failed to save to local storage:', error)
      return false
    }
  }

  const loadFromLocal = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load from local storage:', error)
      return null
    }
  }

  // Cloud Storage Functions (Supabase integration placeholder)
  const saveToCloud = async (data) => {
    try {
      setSyncStatus('syncing')
      // TODO: Implement Supabase sync
      // const { error } = await supabase
      //   .from('user_data')
      //   .upsert({ user_id: userId, data: data })
      
      // Simulate cloud save for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSyncStatus('success')
      return true
    } catch (error) {
      console.error('Failed to save to cloud:', error)
      setSyncStatus('error')
      return false
    }
  }

  const loadFromCloud = async () => {
    try {
      setSyncStatus('syncing')
      // TODO: Implement Supabase sync
      // const { data, error } = await supabase
      //   .from('user_data')
      //   .select('data')
      //   .eq('user_id', userId)
      //   .single()
      
      setSyncStatus('success')
      return null // Return cloud data when implemented
    } catch (error) {
      console.error('Failed to load from cloud:', error)
      setSyncStatus('error')
      return null
    }
  }

  // AI分析功能
  const getAIInsights = (data) => {
    if (!data || !data.transactions || data.transactions.length === 0) {
      return [{
        type: 'welcome',
        message: '欢迎使用AI财务助手！开始记录您的收支，我将为您提供个性化的财务分析和建议。'
      }]
    }

    const insights = []

    // 检查高支出类别
    data.categories.forEach(category => {
      if (AI_INSIGHTS.highExpense.condition(data, category)) {
        insights.push({
          type: 'highExpense',
          category: category.id,
          message: AI_INSIGHTS.highExpense.message(category)
        })
      }
    })

    // 检查预算超支
    data.budgets.forEach(budget => {
      if (AI_INSIGHTS.budgetExceeded.condition(data, budget)) {
        insights.push({
          type: 'budgetExceeded',
          budget: budget.id,
          message: AI_INSIGHTS.budgetExceeded.message(budget)
        })
      }
    })

    // 检查储蓄机会
    if (AI_INSIGHTS.savingOpportunity.condition(data)) {
      insights.push({
        type: 'savingOpportunity',
        message: AI_INSIGHTS.savingOpportunity.message()
      })
    }

    // 检查不稳定的储蓄
    if (AI_INSIGHTS.inconsistentSaving.condition(data)) {
      insights.push({
        type: 'inconsistentSaving',
        message: AI_INSIGHTS.inconsistentSaving.message()
      })
    }

    // 检查分类使用情况
    if (AI_INSIGHTS.noCategories.condition(data)) {
      insights.push({
        type: 'noCategories',
        message: AI_INSIGHTS.noCategories.message()
      })
    }

    // 检查预算使用情况
    if (AI_INSIGHTS.noBudgets.condition(data)) {
      insights.push({
        type: 'noBudgets',
        message: AI_INSIGHTS.noBudgets.message()
      })
    }

    // 如果没有洞察，提供一般性建议
    if (insights.length === 0) {
      insights.push({
        type: 'general',
        message: '您的财务状况看起来不错！继续保持良好的记账习惯，定期检查您的财务目标。'
      })
    }

    return insights
  }

  // 获取个性化财务建议
  const getFinancialAdvice = (data) => {
    if (!data || !data.transactions || data.transactions.length === 0) {
      return '开始记录您的收支，我将为您提供个性化的财务建议。'
    }

    // 计算收入和支出
    const income = data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const savings = income - expense
    const savingsRate = income > 0 ? (savings / income) * 100 : 0

    // 根据储蓄率提供建议
    if (savingsRate < 0) {
      return '您的支出超过了收入。建议审查您的支出，找出可以削减的领域，或考虑增加收入来源。'
    } else if (savingsRate < 10) {
      return '您的储蓄率较低。尝试实施50/30/20预算规则：50%用于必需品，30%用于个人支出，20%用于储蓄和投资。'
    } else if (savingsRate < 20) {
      return '您的储蓄率不错。考虑建立应急基金，理想情况下应覆盖3-6个月的生活费用。'
    } else if (savingsRate < 30) {
      return '您的储蓄率很好！现在可以考虑投资一部分储蓄，以实现长期财务增长。'
    } else {
      return '您的储蓄率非常出色！考虑咨询财务顾问，制定更全面的投资和退休计划。'
    }
  }

  // 分析支出模式
  const analyzeSpendingPatterns = (data) => {
    if (!data || !data.transactions || data.transactions.length === 0) {
      return []
    }

    // 按类别分组支出
    const categorySpending = {}
    data.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!categorySpending[t.category]) {
          categorySpending[t.category] = 0
        }
        categorySpending[t.category] += t.amount
      })

    // 计算总支出
    const totalExpense = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

    // 转换为百分比并排序
    const patterns = Object.entries(categorySpending).map(([categoryId, amount]) => {
      const category = data.categories.find(c => c.id === categoryId) || { name: categoryId, icon: '📝' }
      return {
        category: category.name,
        icon: category.icon,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      }
    }).sort((a, b) => b.amount - a.amount)

    return patterns
  }

  // Main Storage Interface
  const saveData = async (data) => {
    // Always save to local storage first
    const localSuccess = saveToLocal(data)
    
    // Try to save to cloud if online
    if (isOnline) {
      await saveToCloud(data)
    }
    
    return localSuccess
  }

  const loadData = async () => {
    // Try to load from cloud first if online
    if (isOnline) {
      const cloudData = await loadFromCloud()
      if (cloudData) {
        // Also save to local as backup
        saveToLocal(cloudData)
        return cloudData
      }
    }
    
    // Fallback to local storage
    return loadFromLocal() || {
      transactions: [],
      categories: [],
      budgets: []
    }
  }

  // Export Functions
  const exportToJSON = (data) => {
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accounting_data_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = (transactions) => {
    const headers = ['日期', '类型', '分类', '金额', '备注']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.date,
        t.type === 'income' ? '收入' : '支出',
        t.categoryName || t.category,
        t.amount,
        `"${t.note || ''}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const value = {
    isOnline,
    syncStatus,
    saveData,
    loadData,
    exportToJSON,
    exportToCSV,
    saveToLocal,
    loadFromLocal,
    getAIInsights,
    getFinancialAdvice,
    analyzeSpendingPatterns
  }

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider')
  }
  return context
}