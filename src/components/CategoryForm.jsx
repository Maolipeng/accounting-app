import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'

const COLORS = [
  '#ef4444', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#6b7280'
]

const ICONS = [
  '🍽️', '🚗', '🎮', '🛍️', '🏥', '📚', '🏠', '💰', '📈', '📝',
  '✈️', '🏋️', '🎬', '🎵', '👕', '💄', '🎁', '🏆', '🧾', '🔧'
]

const CategoryForm = ({ category = null, onClose }) => {
  const { dispatch } = useTransactions()
  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: '#6b7280',
    id: ''
  })
  const [errors, setErrors] = useState({})

  // Populate form if editing existing category
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        id: category.id
      })
    }
  }, [category])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入分类名称'
    }

    if (!formData.icon) {
      newErrors.icon = '请选择图标'
    }

    if (!formData.color) {
      newErrors.color = '请选择颜色'
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
      const categoryData = {
        id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color
      }

      if (category) {
        dispatch({ type: 'UPDATE_CATEGORY', payload: categoryData })
      } else {
        dispatch({ type: 'ADD_CATEGORY', payload: categoryData })
      }

      onClose()
    } catch (error) {
      console.error('Failed to save category:', error)
      setErrors({ submit: '保存分类失败，请重试。' })
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
          {category ? '编辑分类' : '添加新分类'}
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
        {/* Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            分类名称
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="例如：餐饮、交通等"
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图标
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => handleChange('icon', icon)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.icon === icon
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center text-2xl">{icon}</div>
              </button>
            ))}
          </div>
          {errors.icon && <p className="text-sm text-red-600 mt-1">{errors.icon}</p>}
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            颜色
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('color', color)}
                className={`h-10 rounded-lg border-2 transition-colors ${
                  formData.color === color
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {errors.color && <p className="text-sm text-red-600 mt-1">{errors.color}</p>}
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
            <span>{category ? '更新分类' : '保存分类'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default CategoryForm