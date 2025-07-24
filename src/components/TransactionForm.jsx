import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, Save } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import { useToast } from '../context/ToastContext'
import { format } from 'date-fns'

const TransactionForm = ({ transaction = null, onClose, categories }) => {
  const { dispatch } = useTransactions()
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd')
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form if editing existing transaction
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        note: transaction.note || '',
        date: transaction.date
      })
    }
  }, [transaction])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.type) {
      newErrors.type = 'Please select transaction type'
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const categoryData = categories.find(c => c.id === formData.category)
      const transactionData = {
        id: transaction?.id || Date.now().toString(),
        type: formData.type,
        category: formData.category,
        categoryName: categoryData?.name || formData.category,
        amount: parseFloat(formData.amount),
        note: formData.note.trim(),
        date: formData.date,
        createdAt: transaction?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (transaction) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: transactionData })
        showSuccess('交易记录已成功更新！')
      } else {
        dispatch({ type: 'ADD_TRANSACTION', payload: transactionData })
        showSuccess('交易记录已成功添加！')
      }

      onClose()
    } catch (error) {
      console.error('Failed to save transaction:', error)
      showError('保存交易记录失败，请重试')
      setErrors({ submit: '保存交易记录失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => {
    if (formData.type === 'income') {
      return ['salary', 'investment', 'other'].includes(category.id)
    } else {
      return !['salary', 'investment'].includes(category.id)
    }
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {transaction ? '编辑交易' : '添加新交易'}
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
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            交易类型
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('type', 'expense')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                formData.type === 'expense'
                  ? 'border-danger-500 bg-danger-50 text-danger-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">💸</div>
                <div className="font-medium">支出</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'income')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                formData.type === 'income'
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">💰</div>
                <div className="font-medium">收入</div>
              </div>
            </button>
          </div>
          {errors.type && <p className="text-sm text-danger-600 mt-1">{errors.type}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分类
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredCategories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleChange('category', category.id)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.category === category.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl mb-1">{category.icon}</div>
                  <div className="text-xs font-medium">{category.name}</div>
                </div>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-sm text-danger-600 mt-1">{errors.category}</p>}
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
            className={`input ${errors.amount ? 'border-danger-500' : ''}`}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-sm text-danger-600 mt-1">{errors.amount}</p>}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            日期
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={`input ${errors.date ? 'border-danger-500' : ''}`}
          />
          {errors.date && <p className="text-sm text-danger-600 mt-1">{errors.date}</p>}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
            备注 (可选)
          </label>
          <textarea
            id="note"
            rows={3}
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="input resize-none"
            placeholder="添加关于此交易的备注..."
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-md">
            <p className="text-sm text-danger-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 py-2"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1 py-2 flex items-center justify-center space-x-2"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? '保存中...' : '保存交易'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default TransactionForm