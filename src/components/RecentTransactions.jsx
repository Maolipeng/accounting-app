import React from 'react'
import { format } from 'date-fns'
import { Edit, Trash2, Plus } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'

const RecentTransactions = ({ transactions, categories, showAddButton = true, onEdit, onDelete }) => {
  const { dispatch } = useTransactions()

  const handleDelete = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId })
    }
  }

  const getCategoryData = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: '未分类', icon: '📝', color: '#6b7280' }
  }

  if (transactions.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无交易记录</h3>
          <p className="text-gray-600 mb-4">开始添加您的第一笔交易</p>
          {showAddButton && (
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              添加交易
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">最近交易</h3>
        {showAddButton && (
          <button className="btn btn-primary text-sm">
            <Plus className="h-4 w-4 mr-1" />
            添加
          </button>
        )}
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => {
          const category = getCategoryData(transaction.categoryId || transaction.category?.id)
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {/* Category Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
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
                      {transaction.type === 'income' ? '收入' : '支出'}
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

              <div className="flex items-center space-x-3">
                {/* Amount */}
                <span
                  className={`font-semibold ${
                    transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
                </span>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEdit && onEdit(transaction)}
                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Edit transaction"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
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

      {transactions.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            查看所有交易 →
          </button>
        </div>
      )}
    </div>
  )
}

export default RecentTransactions