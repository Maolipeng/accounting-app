import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BudgetForm = ({ isOpen, onClose, editingBudget, onSave }) => {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [categories, setCategories] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      if (isOpen) {
        try {
          const response = await api.categories.list();
          setCategories(response.categories || []);
        } catch (error) {
          showToast('获取分类失败', 'error');
        }
      }
    };
    fetchCategories();
  }, [isOpen, showToast]);

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAmount(editingBudget.amount);
      setPeriod(editingBudget.period);
    } else {
      setCategoryId('');
      setAmount('');
      setPeriod('monthly');
    }
  }, [editingBudget, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const budgetData = { 
      categoryId, 
      amount: parseFloat(amount), 
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    try {
      let response;
      if (editingBudget) {
        response = await api.budgets.update(editingBudget.id, budgetData);
      } else {
        response = await api.budgets.create(budgetData);
      }
      // 确保返回的预算对象包含必要的属性
      const selectedCategory = categories.find(c => c.id === categoryId);
      const savedBudget = {
        ...response.budget,
        spent: 0,
        percentage: 0,
        categoryName: selectedCategory ? selectedCategory.name : '未知分类'
      };
      onSave(savedBudget);
      onClose();
      showToast(`预算已${editingBudget ? '更新' : '创建'}`, 'success');
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{editingBudget ? '编辑预算' : '添加预算'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
              required
            >
              <option value="">选择一个分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              required
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">周期</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input"
              required
            >
              <option value="monthly">每月</option>
              <option value="yearly">每年</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;