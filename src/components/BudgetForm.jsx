import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useTransactions } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';

const BudgetForm = ({ isOpen, onClose, editingBudget }) => {
  const { categories, addBudget, updateBudget } = useTransactions();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (editingBudget) {
      setAmount(editingBudget.amount.toString());
      setCategoryId(editingBudget.categoryId);
    } else {
      setAmount('');
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
    }
  }, [editingBudget, isOpen, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !categoryId) {
      showToast('请填写所有必填项', 'error');
      return;
    }

    const budgetData = {
      amount: parseFloat(amount),
      categoryId,
    };

    if (editingBudget) {
      updateBudget({ ...editingBudget, ...budgetData });
      showToast('预算更新成功', 'success');
    } else {
      addBudget(budgetData);
      showToast('预算添加成功', 'success');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingBudget ? '编辑预算' : '添加新预算'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="budget-category" className="block text-sm font-medium text-gray-700">
            分类
          </label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input mt-1"
            required
          >
            {expenseCategories.length > 0 ? (
              expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))
            ) : (
              <option disabled>请先创建支出分类</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700">
            预算金额
          </label>
          <input
            type="number"
            id="budget-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input mt-1"
            placeholder="1000"
            required
          />
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary mr-3">
            取消
          </button>
          <button type="submit" className="btn-primary">
            {editingBudget ? '更新预算' : '保存预算'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetForm;