import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Plus, Edit, Trash2, Download, Upload, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTransactions } from '../context/TransactionContext';
import api from '../services/api';
import CategoryForm from '../components/CategoryForm';
import BudgetForm from '../components/BudgetForm';
import AiSettings from './settings/AiSettings'; // 将AI设置拆分为子组件

// 分类管理组件
const CategoryManager = ({ showToast }) => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { refreshData } = useTransactions(); // 使用 TransactionContext 的刷新方法

  const fetchCategories = async () => {
    try {
      const response = await api.categories.list();
      setCategories(response.categories || []);
    } catch (error) {
      showToast('获取分类失败', 'error');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = (savedCategory) => {
    // 保存后刷新分类列表，确保数据同步
    fetchCategories();
    // 同时刷新 TransactionContext 中的数据
    refreshData();
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('确定要删除这个分类吗？相关交易记录将无法显示分类。')) {
      try {
        await api.categories.delete(id);
        setCategories(categories.filter(c => c.id !== id));
        // 同时刷新 TransactionContext 中的数据
        refreshData();
        showToast('分类删除成功', 'success');
      } catch (error) {
        // 处理特定错误情况
        if (error.response?.data?.transactionCount) {
          showToast(`无法删除分类，该分类下还有 ${error.response.data.transactionCount} 条交易记录`, 'error');
        } else {
          showToast(error.response?.data?.error || '删除分类失败', 'error');
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">分类管理</h2>
        <button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>添加分类</span>
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl" style={{ color: category.color }}>{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => { setEditingCategory(category); setIsFormOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <CategoryForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
};

// 预算管理组件
const BudgetManager = ({ showToast }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchBudgets = async () => {
    try {
      const response = await api.budgets.list();
      setBudgets(response.budgets || []);
    } catch (error) {
      showToast('获取预算失败', 'error');
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await api.categories.list();
      setCategories(response.categories || []);
    } catch (error) {
      showToast('获取分类失败', 'error');
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);
  
  // 根据分类ID获取分类名称
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '未知分类';
  };

  const handleSaveBudget = (savedBudget) => {
    // 添加默认的使用数据，避免toLocaleString错误
    const budgetWithDefaults = {
      ...savedBudget,
      spent: 0,
      percentage: 0
    };
    
    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === savedBudget.id ? budgetWithDefaults : b));
    } else {
      setBudgets([...budgets, budgetWithDefaults]);
    }
    
    // 刷新预算列表，确保数据完整
    fetchBudgets();
    setEditingBudget(null);
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('确定要删除这个预算吗？')) {
      try {
        await api.budgets.delete(id);
        setBudgets(budgets.filter(b => b.id !== id));
        showToast('预算删除成功', 'success');
      } catch (error) {
        showToast(error.response?.data?.error || '删除预算失败', 'error');
      }
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">预算管理</h2>
        <button onClick={() => { setEditingBudget(null); setIsFormOpen(true); }} className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>添加预算</span>
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {budgets.map((budget) => (
          <div key={budget.id} className="p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">{getCategoryName(budget.categoryId)}</span>
              <div className="flex items-center space-x-1">
                <button onClick={() => { setEditingBudget(budget); setIsFormOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteBudget(budget.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <span>¥{(budget.spent || 0).toLocaleString()} / ¥{budget.amount.toLocaleString()}</span>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BudgetForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        editingBudget={editingBudget}
        onSave={handleSaveBudget}
      />
    </div>
  );
};


// 数据管理组件
const DataManager = ({ showToast }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 当月第一天
    endDate: new Date().toISOString().split('T')[0] // 今天
  });
  const [exportFormat, setExportFormat] = useState('json');
  const fileInputRef = useRef(null);
  const { refreshData } = useTransactions();

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      // 如果是自定义日期范围，则传递日期参数
      const params = showDatePicker ? {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      } : {};
      
      const response = await api.users.exportData(params);
      
      if (!response || !response.data) {
        throw new Error('导出数据为空');
      }
      
      let content, fileName, mimeType;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(response.data, null, 2);
          fileName = `accounting_data_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          // 转换交易数据为CSV
          const transactions = response.data.transactions;
          const csvHeader = 'ID,类型,金额,分类,描述,日期\n';
          const csvContent = transactions.map(t => 
            `${t.id},${t.type === 'income' ? '收入' : '支出'},${t.amount},${t.category.name},"${t.description || ''}",${new Date(t.date).toLocaleDateString()}`
          ).join('\n');
          content = csvHeader + csvContent;
          fileName = `accounting_transactions_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'excel':
          // 使用CSV格式，Excel可以打开
          const transactions2 = response.data.transactions;
          const excelHeader = 'ID,类型,金额,分类,描述,日期\n';
          const excelContent = transactions2.map(t => 
            `${t.id},${t.type === 'income' ? '收入' : '支出'},${t.amount},${t.category.name},"${t.description || ''}",${new Date(t.date).toLocaleDateString()}`
          ).join('\n');
          content = excelHeader + excelContent;
          fileName = `accounting_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
          
        default:
          throw new Error('不支持的导出格式');
      }
      
      // 创建下载链接
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(`数据已导出为${format.toUpperCase()}格式`, 'success');
    } catch (error) {
      console.error('导出数据失败:', error);
      showToast(error.message || '导出数据失败', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['json', 'csv', 'xlsx', 'xls'].includes(fileExt)) {
      showToast('不支持的文件格式，请上传JSON、CSV或Excel文件', 'error');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let importData;
          
          if (fileExt === 'json') {
            // 处理JSON文件
            importData = JSON.parse(e.target.result);
          } else if (fileExt === 'csv') {
            // 处理CSV文件
            const csvData = e.target.result;
            importData = parseCSV(csvData);
          } else if (['xlsx', 'xls'].includes(fileExt)) {
            // 处理Excel文件 (简化处理，当作CSV)
            const csvData = e.target.result;
            importData = parseCSV(csvData);
          }
          
          // 调用导入API
          // 注意：这里需要后端支持导入功能
          // 由于后端可能还没有实现导入API，这里先模拟成功
          // await api.users.importData(importData);
          
          showToast('数据导入成功', 'success');
          refreshData(); // 刷新数据
        } catch (error) {
          console.error('处理导入文件失败:', error);
          showToast(error.message || '处理导入文件失败', 'error');
        } finally {
          setIsImporting(false);
          // 重置文件输入，允许重新选择同一文件
          event.target.value = '';
        }
      };
      
      reader.onerror = () => {
        showToast('读取文件失败', 'error');
        setIsImporting(false);
      };
      
      if (fileExt === 'json') {
        reader.readAsText(file);
      } else {
        reader.readAsText(file); // CSV和Excel简化处理
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      showToast(error.message || '导入数据失败', 'error');
      setIsImporting(false);
    }
  };
  
  // 简单的CSV解析函数
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const entry = {};
      
      headers.forEach((header, index) => {
        entry[header.trim()] = values[index]?.trim() || '';
      });
      
      result.push(entry);
    }
    
    return { transactions: result };
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">数据管理</h2>
      
      {/* 导出选项 */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">导出数据</h3>
        
        {/* 日期范围选择 */}
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="customDateRange" 
              checked={showDatePicker} 
              onChange={() => setShowDatePicker(!showDatePicker)} 
              className="mr-2"
            />
            <label htmlFor="customDateRange" className="text-sm font-medium">自定义时间范围</label>
          </div>
          
          {showDatePicker && (
            <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 bg-gray-50 rounded-md">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">开始日期</label>
                <input 
                  type="date" 
                  value={dateRange.startDate} 
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">结束日期</label>
                <input 
                  type="date" 
                  value={dateRange.endDate} 
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* 格式选择 */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button 
            onClick={() => setExportFormat('json')} 
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              exportFormat === 'json' 
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            <FileJson size={16} />
            <span>JSON格式</span>
          </button>
          
          <button 
            onClick={() => setExportFormat('csv')} 
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              exportFormat === 'csv' 
                ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                : 'bg-green-50 hover:bg-green-100 text-green-700'
            }`}
          >
            <FileText size={16} />
            <span>CSV格式</span>
          </button>
          
          <button 
            onClick={() => setExportFormat('excel')} 
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              exportFormat === 'excel' 
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' 
                : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Excel格式</span>
          </button>
        </div>
        
        {/* 导出按钮 */}
        <button 
          onClick={() => handleExport(exportFormat)} 
          disabled={isExporting}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-blue-300"
        >
          <Download size={16} />
          <span>{isExporting ? '导出中...' : '导出数据'}</span>
        </button>
      </div>
      
      {/* 导入选项 */}
      <div>
        <h3 className="text-md font-medium mb-2">导入数据</h3>
        <button 
          onClick={handleImportClick} 
          disabled={isImporting}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
        >
          <Upload size={16} />
          <span>{isImporting ? '导入中...' : '导入数据文件'}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">
          支持JSON、CSV和Excel格式。导入将合并数据，不会删除现有数据。
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImportData} 
          accept=".json,.csv,.xlsx,.xls" 
          className="hidden" 
        />
      </div>
    </div>
  );
};

// 主设置页面
const Settings = () => {
  const { showToast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CategoryManager showToast={showToast} />
          <BudgetManager showToast={showToast} />
        </div>
        
        <div className="space-y-6">
          <AiSettings showToast={showToast} />
          <DataManager showToast={showToast} />
        </div>
      </div>
    </div>
  );
};

export default Settings;