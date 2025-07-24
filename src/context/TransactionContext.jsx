import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useStorage } from './StorageContext'

const TransactionContext = createContext()

const initialState = {
  transactions: [],
  categories: [
    { id: 'food', name: '餐饮', icon: '🍽️', color: '#ef4444' },
    { id: 'transport', name: '交通', icon: '🚗', color: '#3b82f6' },
    { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#8b5cf6' },
    { id: 'shopping', name: '购物', icon: '🛍️', color: '#f59e0b' },
    { id: 'health', name: '医疗', icon: '🏥', color: '#10b981' },
    { id: 'education', name: '教育', icon: '📚', color: '#06b6d4' },
    { id: 'housing', name: '住房', icon: '🏠', color: '#84cc16' },
    { id: 'salary', name: '工资', icon: '💰', color: '#22c55e' },
    { id: 'investment', name: '投资', icon: '📈', color: '#6366f1' },
    { id: 'other', name: '其他', icon: '📝', color: '#6b7280' }
  ],
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

  // Load data on mount
  useEffect(() => {
    const loadStoredData = async () => {
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
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadStoredData()
  }, [loadData])

  // Save data when state changes
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
    
    if (state.transactions.length > 0 || state.budgets.length > 0) {
      saveCurrentData()
    }
  }, [state.transactions, state.categories, state.budgets, saveData])

  const value = {
    ...state,
    dispatch
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
  return context
}