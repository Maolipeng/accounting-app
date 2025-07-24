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

  const exportToExcel = async (data) => {
    try {
      // 动态导入 xlsx 库
      const XLSX = await import('xlsx')
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      
      // 交易数据工作表
      const transactionData = data.transactions.map(t => ({
        '日期': t.date,
        '类型': t.type === 'income' ? '收入' : '支出',
        '分类': t.categoryName || t.category,
        '金额': t.amount,
        '备注': t.note || ''
      }))
      const transactionSheet = XLSX.utils.json_to_sheet(transactionData)
      XLSX.utils.book_append_sheet(workbook, transactionSheet, '交易记录')
      
      // 分类数据工作表
      const categoryData = data.categories.map(c => ({
        '名称': c.name,
        '图标': c.icon,
        '颜色': c.color,
        '类型': c.type === 'income' ? '收入' : '支出'
      }))
      const categorySheet = XLSX.utils.json_to_sheet(categoryData)
      XLSX.utils.book_append_sheet(workbook, categorySheet, '分类设置')
      
      // 预算数据工作表
      const budgetData = data.budgets.map(b => ({
        '名称': b.name,
        '分类': b.category,
        '金额': b.amount,
        '周期': b.period === 'monthly' ? '月度' : '年度'
      }))
      const budgetSheet = XLSX.utils.json_to_sheet(budgetData)
      XLSX.utils.book_append_sheet(workbook, budgetSheet, '预算设置')
      
      // 导出文件
      XLSX.writeFile(workbook, `accounting_data_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error('Excel导出失败:', error)
      throw new Error('Excel导出失败，请确保浏览器支持此功能')
    }
  }

  // Import Functions
  const importFromJSON = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          
          // 验证数据格式
          if (!data.transactions || !Array.isArray(data.transactions)) {
            throw new Error('无效的JSON格式：缺少交易数据')
          }
          
          // 数据清理和验证
          const cleanData = {
            transactions: data.transactions.map(t => ({
              id: t.id || Date.now() + Math.random(),
              type: t.type,
              category: t.category,
              categoryName: t.categoryName,
              amount: parseFloat(t.amount),
              note: t.note || '',
              date: t.date
            })),
            categories: data.categories || [],
            budgets: data.budgets || []
          }
          
          resolve(cleanData)
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  const importFromCSV = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csvText = e.target.result
          const lines = csvText.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            throw new Error('CSV文件格式无效：至少需要标题行和一行数据')
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          const transactions = []
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
            
            if (values.length >= 4) {
              const transaction = {
                id: Date.now() + Math.random() + i,
                date: values[0] || new Date().toISOString().split('T')[0],
                type: values[1] === '收入' ? 'income' : 'expense',
                category: values[2] || '其他',
                categoryName: values[2] || '其他',
                amount: parseFloat(values[3]) || 0,
                note: values[4] || ''
              }
              
              if (transaction.amount > 0) {
                transactions.push(transaction)
              }
            }
          }
          
          resolve({
            transactions,
            categories: [],
            budgets: []
          })
        } catch (error) {
          reject(new Error(`CSV解析失败: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file, 'utf-8')
    })
  }

  const importFromExcel = async (file) => {
    try {
      // 动态导入 xlsx 库
      const XLSX = await import('xlsx')
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            
            let transactions = []
            let categories = []
            let budgets = []
            
            // 读取交易记录工作表
            if (workbook.SheetNames.includes('交易记录')) {
              const worksheet = workbook.Sheets['交易记录']
              const jsonData = XLSX.utils.sheet_to_json(worksheet)
              
              transactions = jsonData.map((row, index) => ({
                id: Date.now() + Math.random() + index,
                date: row['日期'] || new Date().toISOString().split('T')[0],
                type: row['类型'] === '收入' ? 'income' : 'expense',
                category: row['分类'] || '其他',
                categoryName: row['分类'] || '其他',
                amount: parseFloat(row['金额']) || 0,
                note: row['备注'] || ''
              })).filter(t => t.amount > 0)
            }
            
            // 读取分类设置工作表
            if (workbook.SheetNames.includes('分类设置')) {
              const worksheet = workbook.Sheets['分类设置']
              const jsonData = XLSX.utils.sheet_to_json(worksheet)
              
              categories = jsonData.map((row, index) => ({
                id: Date.now() + Math.random() + index,
                name: row['名称'] || '未命名',
                icon: row['图标'] || '📝',
                color: row['颜色'] || '#3B82F6',
                type: row['类型'] === '收入' ? 'income' : 'expense'
              }))
            }
            
            // 读取预算设置工作表
            if (workbook.SheetNames.includes('预算设置')) {
              const worksheet = workbook.Sheets['预算设置']
              const jsonData = XLSX.utils.sheet_to_json(worksheet)
              
              budgets = jsonData.map((row, index) => ({
                id: Date.now() + Math.random() + index,
                name: row['名称'] || '未命名预算',
                category: row['分类'] || '所有分类',
                amount: parseFloat(row['金额']) || 0,
                period: row['周期'] === '年度' ? 'yearly' : 'monthly'
              })).filter(b => b.amount > 0)
            }
            
            resolve({
              transactions,
              categories,
              budgets
            })
          } catch (error) {
            reject(new Error(`Excel解析失败: ${error.message}`))
          }
        }
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsArrayBuffer(file)
      })
    } catch (error) {
      throw new Error('Excel导入失败，请确保浏览器支持此功能')
    }
  }

  const importData = async (file) => {
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.json')) {
      return await importFromJSON(file)
    } else if (fileName.endsWith('.csv')) {
      return await importFromCSV(file)
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await importFromExcel(file)
    } else {
      throw new Error('不支持的文件格式。请选择 JSON、CSV 或 Excel 文件。')
    }
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
    exportToExcel,
    importData,
    importFromJSON,
    importFromCSV,
    importFromExcel,
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