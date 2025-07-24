import React, { useState, useEffect, useRef } from 'react'
import { Settings as SettingsIcon, Plus, Edit, Trash2, Download, Upload, Cloud, Wifi, WifiOff, MessageCircle } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import { useStorage } from '../context/StorageContext'
import { useToast } from '../context/ToastContext'
import CategoryForm from '../components/CategoryForm'
import BudgetForm from '../components/BudgetForm'
import { aiService } from '../services/aiService'

const Settings = () => {
  const { transactions, categories, budgets, deleteCategory, deleteBudget } = useTransactions()
  const { exportToJSON, exportToCSV, exportToExcel, importFromFile, isOnline, syncStatus } = useStorage()
  const { showToast } = useToast()
  
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingBudget, setEditingBudget] = useState(null)
  
  const [aiConfig, setAiConfig] = useState(() => {
    const saved = localStorage.getItem('aiConfig')
    return saved ? JSON.parse(saved) : {
      provider: 'deepseek',
      apiKey: '',
      model: 'deepseek-chat',
      enabled: false
    }
  })

  const [zhipuConfig, setZhipuConfig] = useState(() => {
    const saved = localStorage.getItem('zhipuConfig');
    if (saved) {
      let loadedConfig = JSON.parse(saved);
      if (loadedConfig.model === 'GLM-4-Flash-250414') {
        loadedConfig.model = 'glm-4v';
        localStorage.setItem('zhipuConfig', JSON.stringify(loadedConfig));
      }
      return loadedConfig;
    }
    return {
      apiKey: '',
      model: 'glm-4v',
      enabled: false
    };
  })

  const saveAIConfig = () => {
    try {
      localStorage.setItem('aiConfig', JSON.stringify(aiConfig))
      aiService.updateConfig(aiConfig)
      showToast('AI配置已保存', 'success')
    } catch (error) {
      showToast('保存AI配置失败: ' + error.message, 'error')
    }
  }

  const isInitialZhipuMount = useRef(true);
  useEffect(() => {
    if (isInitialZhipuMount.current) {
      isInitialZhipuMount.current = false;
    } else {
      try {
        localStorage.setItem('zhipuConfig', JSON.stringify(zhipuConfig));
        aiService.updateZhipuConfig(zhipuConfig);
        showToast('智谱AI配置已自动保存', 'success');
      } catch (error) {
        showToast('保存智谱AI配置失败: ' + error.message, 'error');
      }
    }
  }, [zhipuConfig]);

  const testAIConnection = async () => {
    try {
      await aiService.askQuestion('你好，请回复"连接成功"')
      showToast('AI连接测试成功！', 'success')
    } catch (error) {
      showToast('AI连接测试失败: ' + error.message, 'error')
    }
  }

  const handleExport = (format) => {
    try {
      const data = { transactions, categories, budgets }
      if (format === 'json') exportToJSON(data);
      if (format === 'csv') exportToCSV(transactions);
      if (format === 'excel') exportToExcel(data);
      showToast(`${format.toUpperCase()} 数据导出成功`, 'success')
    } catch (error) {
      showToast('导出失败: ' + error.message, 'error')
    }
  }

  const handleImportData = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      const result = await importFromFile(file)
      showToast(`导入成功！交易: ${result.transactions}条, 分类: ${result.categories}条, 预算: ${result.budgets}条`, 'success')
    } catch (error) {
      showToast('导入失败: ' + error.message, 'error')
    }
    event.target.value = ''
  }

  useEffect(() => {
    aiService.updateConfig(aiConfig)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">分类管理</h2>
            <button onClick={() => setShowCategoryForm(true)} className="btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>添加分类</span>
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.type === 'income' ? '收入' : '支出'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => { setEditingCategory(category); setShowCategoryForm(true); }} className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">预算管理</h2>
            <button onClick={() => setShowBudgetForm(true)} className="btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>添加预算</span>
            </button>
          </div>
          <div className="space-y-2">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{budget.categoryName}</div>
                  <div className="text-sm text-gray-500">¥{budget.amount.toLocaleString()}/月</div>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => { setEditingBudget(budget); setShowBudgetForm(true); }} className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteBudget(budget.id)} className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">数据管理</h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">导出数据</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleExport('json')} className="btn-secondary flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button onClick={() => handleExport('csv')} className="btn-secondary flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
                <button onClick={() => handleExport('excel')} className="btn-secondary flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">导入数据</h4>
              <input
                type="file"
                accept=".json,.csv,.xlsx,.xls"
                onChange={handleImportData}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-2">支持JSON、CSV、Excel格式。</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">云同步状态</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">网络状态</span>
              <div className={`flex items-center space-x-2 text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>{isOnline ? '在线' : '离线'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">同步状态</span>
              <div className="flex items-center space-x-2 text-sm font-medium text-blue-600">
                <Cloud className="h-4 w-4" />
                <span>{syncStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
          AI助手配置
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">AI服务提供商</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">选择AI服务商</label>
              <select
                value={aiConfig.provider}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  let newModel = '';
                  if (newProvider === 'deepseek') newModel = 'deepseek-chat';
                  if (newProvider === 'moonshot') newModel = 'moonshot-v1-8k';
                  if (newProvider === 'openai') newModel = 'gpt-3.5-turbo';
                  setAiConfig(prev => ({ ...prev, provider: newProvider, model: newModel }))
                }}
                className="input"
              >
                <option value="deepseek">DeepSeek (深求)</option>
                <option value="moonshot">Moonshot (Kimi)</option>
                <option value="openai">OpenAI (GPT)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">API密钥</label>
              <input
                id="api-key"
                type="password"
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="input"
                placeholder="输入您的API密钥"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="ai-enabled" className="text-sm font-medium text-gray-700">启用AI助手</label>
                <p className="text-xs text-gray-500">开启后可使用真实的AI分析和建议</p>
              </div>
              <input
                id="ai-enabled"
                type="checkbox"
                checked={aiConfig.enabled}
                onChange={(e) => setAiConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button onClick={saveAIConfig} className="btn-primary flex-1">保存配置</button>
              <button onClick={testAIConnection} className="btn-secondary">测试连接</button>
            </div>
          </div>

          {aiConfig.provider === 'deepseek' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium flex items-center">🖼️ 智谱AI图片识别配置</h3>
              <p className="text-sm text-gray-600">由于DeepSeek不支持图片理解，AI导入功能将使用智谱AI进行图片识别。</p>
              <div className="space-y-2">
                <label htmlFor="zhipu-api-key" className="block text-sm font-medium text-gray-700">智谱AI API密钥</label>
                <input
                  id="zhipu-api-key"
                  type="password"
                  value={zhipuConfig.apiKey}
                  onChange={(e) => setZhipuConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="input"
                  placeholder="输入智谱AI的API密钥"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">模型选择</label>
                <select
                  value={zhipuConfig.model}
                  onChange={(e) => setZhipuConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="input"
                >
                  <option value="glm-4v">GLM-4V (图片识别推荐)</option>
                  <option value="glm-4v-plus">GLM-4V-Plus</option>
                  <option value="GLM-4.1V-Thinking-Flash">GLM-4.1V-Thinking-Flash</option>
                  <option value="GLM-4V-Flash">GLM-4V-Flash</option>
                  <option value="GLM-4-Flash">GLM-4-Flash (纯文本)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="zhipu-enabled" className="text-sm font-medium text-gray-700">启用图片识别</label>
                  <p className="text-xs text-gray-500">开启后可使用AI导入功能</p>
                </div>
                <input
                  id="zhipu-enabled"
                  type="checkbox"
                  checked={zhipuConfig.enabled}
                  onChange={(e) => setZhipuConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showCategoryForm && <CategoryForm isOpen={showCategoryForm} onClose={() => setShowCategoryForm(false)} editingCategory={editingCategory} />}
      {showBudgetForm && <BudgetForm isOpen={showBudgetForm} onClose={() => setShowBudgetForm(false)} editingBudget={editingBudget} />}
    </div>
  )
}

export default Settings