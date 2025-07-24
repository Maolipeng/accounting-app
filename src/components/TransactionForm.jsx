import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useTransactions } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';

const TransactionForm = ({ isOpen, onClose, editingTransaction }) => {
  const { categories, addTransaction, updateTransaction } = useTransactions();
  const { showToast } = useToast();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const filteredCategories = categories;

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
    } else {
      // Reset form for new transaction
      setType('expense');
      setAmount('');
      setCategoryId(filteredCategories.length > 0 ? filteredCategories[0].id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
  }, [editingTransaction, isOpen]);

  useEffect(() => {
    // Update category when type changes
    if (!editingTransaction) {
        setCategoryId(categories.length > 0 ? categories[0].id : '');
    }
  }, [type, categories, editingTransaction]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !categoryId || !date) {
      showToast('请填写所有必填项', 'error');
      return;
    }

    const transactionData = {
      type,
      amount: parseFloat(amount),
      categoryId,
      date,
      description,
    };

    if (editingTransaction) {
      updateTransaction({ ...editingTransaction, ...transactionData });
      showToast('交易更新成功', 'success');
    } else {
      addTransaction(transactionData);
      showToast('交易添加成功', 'success');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTransaction ? '编辑交易' : '添加新交易'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="flex justify-center">
            <div className="flex rounded-md bg-gray-100 p-1">
                <button type="button" onClick={() => setType('expense')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-gray-600'}`}>支出</button>
                <button type="button" onClick={() => setType('income')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${type === 'income' ? 'bg-green-500 text-white shadow' : 'text-gray-600'}`}>收入</button>
            </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">金额</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input mt-1"
            placeholder="0.00"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类</label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input mt-1"
            required
          >
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))
            ) : (
              <option disabled>请先创建该类型的分类</option>
            )}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">日期</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input mt-1"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">备注</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input mt-1"
            placeholder="（可选）"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary mr-3">
            取消
          </button>
          <button type="submit" className="btn-primary">
            {editingTransaction ? '更新' : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;