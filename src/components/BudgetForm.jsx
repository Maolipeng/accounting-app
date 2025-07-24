import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'

const BudgetForm = ({ budget = null, onClose }) => {
  const { dispatch, categories } = useTransactions()
  const [formData, setFormData] = useState({
    name: '',
    category: 'all',
    amount: '',
    period: 'month'
  })
  const [errors, setErrors] = useState({})

  // Populate form if editing existing budget
  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        category: budget.category,
        amount: budget.amount.toString(),
        period: budget.period || 'month',
        id: budget.id
      })
    }
  }, [budget])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入预算名称'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = '请输入有效金额'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const budgetData = {
        id: formData.id || Date.now().toString(),
        name: formData.name.trim(),
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        createdAt: budget?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (budget) {
        dispatch({ type: 'UPDATE_BUDGET', payload: budgetData })
      } else {
        dispatch({ type: 'ADD_BUDGET', payload: budgetData })
      }

      onClose()
    } catch (error) {
      console.error('Failed to save budget:', error)
      setErrors({ submit: '保存预算失败，请重试。' })
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {budget ? '编辑预算' : '添加新预算'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Budget Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            预算名称
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="例如：月度餐饮预算"
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            分类
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="input"
          >
            <option value="all">所有分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            金额 (¥)
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className={`input ${errors.amount ? 'border-red-500' : ''}`}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
        </div>

        {/* Period */}
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
            周期
          </label>
          <select
            id="period"
            value={formData.period}
            onChange={(e) => handleChange('period', e.target.value)}
            className="input"
          >
            <option value="month">每月</option>
            <option value="week">每周</option>
            <option value="year">每年</option>
          </select>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 py-2"
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1 py-2 flex items-center justify-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{budget ? '更新预算' : '保存预算'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default BudgetForm