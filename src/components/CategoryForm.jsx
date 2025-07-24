import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useTransactions } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';

// 常用分类预设
const PRESET_CATEGORIES = {
  expense: [
    { name: '餐饮', icon: '🍽️' },
    { name: '交通', icon: '🚗' },
    { name: '购物', icon: '🛍️' },
    { name: '娱乐', icon: '🎮' },
    { name: '医疗', icon: '🏥' },
    { name: '教育', icon: '📚' },
    { name: '住房', icon: '🏠' },
    { name: '通讯', icon: '📱' },
    { name: '服装', icon: '👕' },
    { name: '美容', icon: '💄' },
    { name: '旅游', icon: '✈️' },
    { name: '运动', icon: '⚽' },
    { name: '宠物', icon: '🐕' },
    { name: '礼品', icon: '🎁' },
    { name: '保险', icon: '🛡️' },
    { name: '维修', icon: '🔧' },
    { name: '水电费', icon: '💡' },
    { name: '网费', icon: '🌐' },
    { name: '停车费', icon: '🅿️' },
    { name: '其他', icon: '📦' }
  ],
  income: [
    { name: '工资', icon: '💼' },
    { name: '奖金', icon: '🏆' },
    { name: '投资', icon: '📈' },
    { name: '兼职', icon: '💻' },
    { name: '红包', icon: '🧧' },
    { name: '退款', icon: '💰' },
    { name: '租金', icon: '🏠' },
    { name: '利息', icon: '🏦' },
    { name: '分红', icon: '💎' },
    { name: '奖励', icon: '🎖️' },
    { name: '礼金', icon: '💝' },
    { name: '补贴', icon: '🎯' },
    { name: '其他', icon: '💸' }
  ]
};

const CategoryForm = ({ isOpen, onClose, editingCategory }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [icon, setIcon] = useState('💰');
  const [showPresets, setShowPresets] = useState(false);
  const { addCategory, updateCategory } = useTransactions();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIcon(editingCategory.icon);
      setShowPresets(false);
    } else {
      // Reset form when adding a new category
      setName('');
      setType('expense');
      setIcon('💰');
      setShowPresets(false);
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !icon.trim()) {
      showToast('分类名称和图标不能为空', 'error');
      return;
    }

    const categoryData = { name, type, icon };

    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryData });
      showToast('分类更新成功', 'success');
    } else {
      addCategory(categoryData);
      showToast('分类添加成功', 'success');
    }
    onClose();
  };

  const handlePresetSelect = (preset) => {
    setName(preset.name);
    setIcon(preset.icon);
    setShowPresets(false);
  };

  const currentPresets = PRESET_CATEGORIES[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? '编辑分类' : '添加新分类'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
            分类名称
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              type="text"
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input flex-1"
              placeholder="例如：餐饮、交通"
              required
            />
            {!editingCategory && (
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {showPresets ? '隐藏' : '预设'}
              </button>
            )}
          </div>
        </div>

        {/* 预设分类选择 */}
        {showPresets && !editingCategory && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              选择常用{type === 'expense' ? '支出' : '收入'}分类：
            </h4>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {currentPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="flex items-center space-x-1 p-2 text-sm bg-white hover:bg-blue-50 border border-gray-200 rounded-md transition-colors"
                >
                  <span>{preset.icon}</span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="category-icon" className="block text-sm font-medium text-gray-700">
            图标 (Emoji)
          </label>
          <input
            type="text"
            id="category-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="input mt-1"
            placeholder="例如：🚗"
            maxLength="2"
            required
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700">类型</span>
          <div className="mt-2 flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="type"
                value="expense"
                checked={type === 'expense'}
                onChange={() => {
                  setType('expense');
                  if (showPresets) {
                    setName('');
                    setIcon('💰');
                  }
                }}
              />
              <span className="ml-2">支出</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="type"
                value="income"
                checked={type === 'income'}
                onChange={() => {
                  setType('income');
                  if (showPresets) {
                    setName('');
                    setIcon('💰');
                  }
                }}
              />
              <span className="ml-2">收入</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary mr-3">
            取消
          </button>
          <button type="submit" className="btn-primary">
            {editingCategory ? '更新' : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;