import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useStorage } from './StorageContext'
import api from '../services/api'

const TransactionContext = createContext()

const initialState = {
  transactions: [],
  categories: [],
  budgets: [],
  filters: {
    type: 'all', // 'all', 'income', 'expense'
    category: 'all',
    dateRange: 'month', // 'day', 'week', 'month', 'year', 'custom'
    startDate: null,
    endDate: null,
    searchTerm: ''
  }
}

function transactionReducer(state, action) {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    
    case 'ADD_TRANSACTION':
      return { 
        ...state, 
        transactions: [action.payload, ...state.transactions] 
      }
    
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      }
    
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      }
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }
    
    case 'ADD_CATEGORY':
      return { 
        ...state, 
        categories: [...state.categories, action.payload] 
      }
    
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      }
    
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      }
    
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload }
    
    case 'ADD_BUDGET':
      return { 
        ...state, 
        budgets: [...state.budgets, action.payload] 
      }
    
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => 
          b.id === action.payload.id ? action.payload : b
        )
      }
    
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload)
      }
    
    default:
      return state
  }
}

export function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState)
  const { loadData, saveData } = useStorage()

  // 从API加载数据
  const loadApiData = async () => {
    try {
      // 获取分类
      const categoriesResponse = await api.categories.list()
      if (categoriesResponse.categories) {
        dispatch({ type: 'SET_CATEGORIES', payload: categoriesResponse.categories })
      }

      // 获取交易记录
      const transactionsResponse = await api.transactions.list()
      if (transactionsResponse.transactions) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsResponse.transactions })
      }

      // 获取预算
      const budgetsResponse = await api.budgets.list()
      if (budgetsResponse.budgets) {
        dispatch({ type: 'SET_BUDGETS', payload: budgetsResponse.budgets })
      }
    } catch (error) {
      console.error('Failed to load API data:', error)
      // 如果API失败，尝试从本地存储加载
      try {
        const data = await loadData()
        if (data.transactions) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: data.transactions })
        }
        if (data.categories) {
          dispatch({ type: 'SET_CATEGORIES', payload: data.categories })
        }
        if (data.budgets) {
          dispatch({ type: 'SET_BUDGETS', payload: data.budgets })
        }
      } catch (localError) {
        console.error('Failed to load local data:', localError)
      }
    }
  }

  // Load data on mount
  useEffect(() => {
    loadApiData()
  }, [])

  // Save data when state changes (作为备份)
  useEffect(() => {
    const saveCurrentData = async () => {
      try {
        await saveData({
          transactions: state.transactions,
          categories: state.categories,
          budgets: state.budgets
        })
      } catch (error) {
        console.error('Failed to save data:', error)
      }
    }
    
    if (state.transactions.length > 0 || state.categories.length > 0 || state.budgets.length > 0) {
      saveCurrentData()
    }
  }, [state.transactions, state.categories, state.budgets, saveData])

  const value = {
    ...state,
    dispatch,
    refreshData: loadApiData
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }
  
  // 添加交易记录
  const addTransaction = async (transactionData) => {
    try {
      const response = await api.transactions.create(transactionData)
      if (response.transaction) {
        context.dispatch({ type: 'ADD_TRANSACTION', payload: response.transaction })
        return response.transaction
      }
    } catch (error) {
      console.error('添加交易失败:', error)
      throw error
    }
  }

  // 更新交易记录
  const updateTransaction = async (transactionData) => {
    try {
      const response = await api.transactions.update(transactionData.id, transactionData)
      if (response.transaction) {
        context.dispatch({ type: 'UPDATE_TRANSACTION', payload: response.transaction })
        return response.transaction
      }
    } catch (error) {
      console.error('更新交易失败:', error)
      throw error
    }
  }

  // 删除交易记录
  const deleteTransaction = async (id) => {
    try {
      await api.transactions.delete(id)
      context.dispatch({ type: 'DELETE_TRANSACTION', payload: id })
    } catch (error) {
      console.error('删除交易失败:', error)
      throw error
    }
  }

  // 添加分类
  const addCategory = async (categoryData) => {
    try {
      const response = await api.categories.create(categoryData)
      if (response.category) {
        context.dispatch({ type: 'ADD_CATEGORY', payload: response.category })
        return response.category
      }
    } catch (error) {
      console.error('添加分类失败:', error)
      throw error
    }
  }

  // 更新分类
  const updateCategory = async (categoryData) => {
    try {
      const response = await api.categories.update(categoryData.id, categoryData)
      if (response.category) {
        context.dispatch({ type: 'UPDATE_CATEGORY', payload: response.category })
        return response.category
      }
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  // 删除分类
  const deleteCategory = async (id) => {
    try {
      await api.categories.delete(id)
      context.dispatch({ type: 'DELETE_CATEGORY', payload: id })
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  // 添加预算
  const addBudget = async (budgetData) => {
    try {
      const response = await api.budgets.create(budgetData)
      if (response.budget) {
        context.dispatch({ type: 'ADD_BUDGET', payload: response.budget })
        return response.budget
      }
    } catch (error) {
      console.error('添加预算失败:', error)
      throw error
    }
  }

  // 更新预算
  const updateBudget = async (budgetData) => {
    try {
      const response = await api.budgets.update(budgetData.id, budgetData)
      if (response.budget) {
        context.dispatch({ type: 'UPDATE_BUDGET', payload: response.budget })
        return response.budget
      }
    } catch (error) {
      console.error('更新预算失败:', error)
      throw error
    }
  }

  // 删除预算
  const deleteBudget = async (id) => {
    try {
      await api.budgets.delete(id)
      context.dispatch({ type: 'DELETE_BUDGET', payload: id })
    } catch (error) {
      console.error('删除预算失败:', error)
      throw error
    }
  }

  return {
    ...context,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget
  }
}
