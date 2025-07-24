import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import TransactionForm from '../components/TransactionForm';
import AIImport from '../components/AIImport';
import { Plus, Edit, Trash2, Filter, Search, ArrowUpDown, Sparkles } from 'lucide-react';

const Transactions = () => {
  const { transactions, categories, deleteTransaction } = useTransactions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showAIImport, setShowAIImport] = useState(false);

  // Filtering and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这笔交易吗？')) {
      deleteTransaction(id);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : '未分类';
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(t.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.categoryId === filterCategory);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [transactions, searchTerm, filterType, filterCategory, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">交易记录</h1>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowAIImport(true)} className="btn-secondary flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>AI导入</span>
          </button>
          <button onClick={handleAddNew} className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>添加交易</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索备注或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          {/* Type Filter */}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input">
            <option value="all">所有类型</option>
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
          {/* Category Filter */}
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input">
            <option value="all">所有分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          {/* Sort */}
          <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="btn-secondary flex items-center justify-center space-x-2">
            <ArrowUpDown className="h-4 w-4" />
            <span>日期排序: {sortOrder === 'desc' ? '最新' : '最早'}</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {filteredAndSortedTransactions.map(transaction => (
            <li key={transaction.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-2.5 h-10 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-medium text-gray-800">{getCategoryName(transaction.categoryId)}</p>
                  <p className="text-sm text-gray-500">{transaction.description || '无备注'}</p>
                  <p className="text-xs text-gray-400 mt-1">{transaction.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <p className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'} ¥{transaction.amount.toFixed(2)}
                </p>
                <button onClick={() => handleEdit(transaction)} className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(transaction.id)} className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {filteredAndSortedTransactions.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">没有找到匹配的交易记录。</p>
        </div>
      )}

      {isFormOpen && (
        <TransactionForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editingTransaction={editingTransaction}
        />
      )}

      {showAIImport && (
        <AIImport
          isOpen={showAIImport}
          onClose={() => setShowAIImport(false)}
        />
      )}
    </div>
  );
};

export default Transactions;