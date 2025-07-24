import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const presetIcons = [
  { icon: '🍔', name: '餐饮' }, { icon: '🛒', name: '购物' }, { icon: '🚗', name: '交通' },
  { icon: '🏠', name: '住房' }, { icon: '🎬', name: '娱乐' }, { icon: '❤️', name: '健康' },
  { icon: '🎓', name: '学习' }, { icon: '💼', name: '办公' }, { icon: '🎁', name: '礼物' },
  { icon: '🐶', name: '宠物' }, { icon: '🧾', name: '账单' }, { icon: '📈', name: '投资' },
  { icon: '🍕', name: '零食' }, { icon: '☕️', name: '饮品' }, { icon: '👕', name: '服饰' },
  { icon: '💻', name: '数码' }, { icon: '💪', name: '运动' }, { icon: '🏥', name: '医疗' },
  { icon: '📱', name: '通讯' }, { icon: '💡', name: '生活缴费' }, { icon: '💇‍♀️', name: '美容美发' },
  { icon: '✈️', name: '旅行' }, { icon: '💰', name: '工资' }, { icon: '❓', name: '其他' },
];

const CategoryForm = ({ isOpen, onClose, editingCategory, onSave }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#cccccc');
  const { showToast } = useToast();

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
    } else {
      setName('');
      setIcon('📁');
      setColor('#cccccc');
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const categoryData = { name, icon, color };

    try {
      let response;
      if (editingCategory) {
        response = await api.categories.update(editingCategory.id, categoryData);
      } else {
        response = await api.categories.create(categoryData);
      }
      onSave(response.category);
      onClose();
      showToast(`分类已${editingCategory ? '更新' : '创建'}`, 'success');
    } catch (error) {
      console.error('分类操作错误:', error);
      // 尝试从不同位置获取错误信息
      const errorMessage = 
        error.response?.data?.error || // API 返回的错误
        error.message || // JS 错误对象
        '分类操作失败'; // 默认错误信息
      showToast(errorMessage, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{editingCategory ? '编辑分类' : '添加分类'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">图标 (Emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="input mb-2"
              maxLength="2"
              required
            />
            <div className="grid grid-cols-8 gap-2 bg-gray-100 p-2 rounded-lg max-h-32 overflow-y-auto">
              {presetIcons.map(preset => (
                <button
                  key={preset.icon}
                  type="button"
                  title={preset.name}
                  onClick={() => setIcon(preset.icon)}
                  className={`text-2xl rounded-md p-1 transition-transform duration-150 ${icon === preset.icon ? 'bg-blue-500 scale-110 text-white' : 'hover:bg-gray-300'}`}
                >
                  {preset.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">颜色</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 p-1 border rounded"
            />
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

export default CategoryForm;
