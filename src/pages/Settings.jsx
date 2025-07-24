import React, { useState } from 'react'
import { Save, Download, Upload, Trash2, Plus, Edit, Palette, Cloud, CloudOff, MessageCircle } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import { useStorage } from '../context/StorageContext'
import { useToast } from '../context/ToastContext'
import CategoryForm from '../components/CategoryForm'
import BudgetForm from '../components/BudgetForm'
import aiService from '../services/aiService'

const Settings = () => {
  const { categories, budgets, transactions, dispatch } = useTransactions()
  const { isOnline, syncStatus, exportToJSON, exportToCSV } = useStorage()
  const { showSuccess, showError, showWarning } = useToast()
  const [activeTab, setActiveTab] = useState('categories')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingBudget, setEditingBudget] = useState(null)
  const [aiConfig, setAiConfig] = useState(() => {
    const saved = localStorage.getItem('ai_config')
    return saved ? JSON.parse(saved) : {
      provider: 'deepseek',
      apiKey: '',
      model: 'deepseek-chat',
      enabled: false
    }
  })

  const tabs = [
    { id: 'categories', label: '分类', icon: Palette },
    { id: 'budgets', label: '预算', icon: Save },
    { id: 'data', label: '数据管理', icon: Download },
    { id: 'sync', label: '同步与备份', icon: Cloud },
    { id: 'ai', label: 'AI助手', icon: MessageCircle }
  ]

  const handleExportJSON = () => {
    exportToJSON({ transactions, categories, budgets })
  }

  const handleExportCSV = () => {
    exportToCSV(transactions)
  }

  const handleSaveAIConfig = () => {
    localStorage.setItem('ai_config', JSON.stringify(aiConfig))
    showSuccess('AI配置已保存！')
  }

  const handleTestAIConnection = async () => {
    if (!aiConfig.apiKey) {
      showWarning('请先输入API密钥')
      return
    }

    try {
      // 更新AI服务配置
      aiService.updateConfig(aiConfig)
      
      // 测试连接
      await aiService.testConnection()
      showSuccess('连接测试成功！')
    } catch (error) {
      showError('连接测试失败：' + error.message)
    }
  }

  const handleImportData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.transactions) {
            dispatch({ type: 'SET_TRANSACTIONS', payload: data.transactions })
          }
          if (data.categories) {
            // Merge with existing categories
            const existingIds = categories.map(c => c.id)
            const newCategories = data.categories.filter(c => !existingIds.includes(c.id))
            newCategories.forEach(category => {
              dispatch({ type: 'ADD_CATEGORY', payload: category })
            })
          }
          if (data.budgets) {
            dispatch({ type: 'SET_BUDGETS', payload: data.budgets })
          }
          showSuccess('数据导入成功！')
        } catch (error) {
          showError('数据导入失败，请检查文件格式')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-600">管理您的分类、预算和数据</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">管理分类</h2>
              <button
                onClick={() => setShowAddCategory(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>添加分类</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div key={category.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">ID: {category.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-1 text-gray-400 hover:text-primary-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          showWarning('确定要删除此分类吗？此操作无法撤销')
                          // 这里可以添加确认对话框组件
                          setTimeout(() => {
                            dispatch({ type: 'DELETE_CATEGORY', payload: category.id })
                            showSuccess('分类已删除')
                          }, 2000)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">预算管理</h2>
              <button
                onClick={() => setShowAddBudget(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>添加预算</span>
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无预算设置</h3>
                <p className="text-gray-600 mb-4">创建预算来跟踪您的支出限额</p>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map(budget => {
                  const spent = transactions
                    .filter(t => 
                      t.type === 'expense' && 
                      (budget.category === 'all' || t.category === budget.category) &&
                      new Date(t.date).getMonth() === new Date().getMonth()
                    )
                    .reduce((sum, t) => sum + t.amount, 0)
                  
                  const percentage = (spent / budget.amount) * 100
                  const isOverBudget = percentage > 100

                  return (
                    <div key={budget.id} className="card">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{budget.name}</h3>
                          <p className="text-sm text-gray-500">
                             {budget.category === 'all' ? '所有分类' : 
                             categories.find(c => c.id === budget.category)?.name || budget.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingBudget(budget)}
                            className="p-1 text-gray-400 hover:text-primary-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              showWarning('确定要删除此预算吗？此操作无法撤销')
                              // 这里可以添加确认对话框组件
                              setTimeout(() => {
                                dispatch({ type: 'DELETE_BUDGET', payload: budget.id })
                                showSuccess('预算已删除')
                              }, 2000)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                        <span>已花费: ¥{spent.toLocaleString()}</span>
                        <span>预算: ¥{budget.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={isOverBudget ? 'text-red-600' : 'text-gray-600'}>
                            已使用 {percentage.toFixed(1)}%
                          </span>
                          {isOverBudget && (
                            <span className="text-red-600">
                              超出预算 ¥{(spent - budget.amount).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">数据管理</h2>

            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">导出数据</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleExportJSON}
                  className="btn btn-secondary flex items-center justify-center space-x-2 p-4"
                >
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">导出为JSON</div>
                    <div className="text-sm text-gray-600">包含所有数据的完整备份</div>
                  </div>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="btn btn-secondary flex items-center justify-center space-x-2 p-4"
                >
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">导出为CSV</div>
                    <div className="text-sm text-gray-600">仅交易记录，适用于Excel</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">导入数据</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  从JSON备份文件导入数据
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="btn btn-primary cursor-pointer"
                >
                  选择文件
                </label>
              </div>
            </div>

            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">数据摘要</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
                  <div className="text-sm text-gray-600">交易记录</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                  <div className="text-sm text-gray-600">分类</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{budgets.length}</div>
                  <div className="text-sm text-gray-600">预算</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">AI助手配置</h2>

            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">AI服务提供商</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择AI服务商
                  </label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) => {
                      const newProvider = e.target.value;
                      let newModel = '';
                      if (newProvider === 'deepseek') newModel = 'deepseek-chat';
                      if (newProvider === 'moonshot') newModel = 'moonshot-v1-8k';
                      if (newProvider === 'openai') newModel = 'gpt-3.5-turbo';
                      if (newProvider === 'anthropic') newModel = 'claude-3-haiku';
                      if (newProvider === 'google') newModel = 'gemini-pro';
                      if (newProvider === 'azure') newModel = 'gpt-35-turbo';

                      setAiConfig(prev => ({ 
                        ...prev, 
                        provider: newProvider,
                        model: newModel
                      }))
                    }}
                    className="input"
                  >
                    <option value="deepseek">DeepSeek (深求)</option>
                    <option value="moonshot">Moonshot (Kimi)</option>
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google (Gemini)</option>
                    <option value="azure">Azure OpenAI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API密钥
                  </label>
                  <input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="input"
                    placeholder="输入您的API密钥"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    您的API密钥将安全存储在本地，不会上传到服务器
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模型选择
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="input"
                  >
                    {aiConfig.provider === 'deepseek' && (
                      <>
                        <option value="deepseek-chat">DeepSeek-Chat</option>
                        <option value="deepseek-coder">DeepSeek-Coder</option>
                      </>
                    )}
                    {aiConfig.provider === 'moonshot' && (
                      <>
                        <option value="moonshot-v1-8k">Moonshot-v1-8k</option>
                        <option value="moonshot-v1-32k">Moonshot-v1-32k</option>
                        <option value="moonshot-v1-128k">Moonshot-v1-128k</option>
                      </>
                    )}
                    {aiConfig.provider === 'openai' && (
                      <>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </>
                    )}
                    {aiConfig.provider === 'anthropic' && (
                      <>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                      </>
                    )}
                    {aiConfig.provider === 'google' && (
                      <>
                        <option value="gemini-pro">Gemini Pro</option>
                      </>
                    )}
                    {aiConfig.provider === 'azure' && (
                      <>
                        <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">启用AI助手</h4>
                    <p className="text-sm text-gray-600">开启后可使用真实的AI分析和建议</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={aiConfig.enabled}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">如何获取API密钥</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>请参考您选择的AI服务商官方文档获取API密钥。</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleTestAIConnection}
                className="btn btn-secondary"
                disabled={!aiConfig.apiKey}
              >
                测试连接
              </button>
              <button
                onClick={handleSaveAIConfig}
                className="btn btn-primary"
              >
                保存配置
              </button>
            </div>

            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">使用统计</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {aiService.getUsageStats().monthly}
                  </div>
                  <div className="text-sm text-gray-600">本月查询次数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {aiService.getUsageStats().total}
                  </div>
                  <div className="text-sm text-gray-600">总查询次数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {aiConfig.enabled && aiConfig.apiKey ? '已启用' : '已禁用'}
                  </div>
                  <div className="text-sm text-gray-600">服务状态</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync & Backup Tab */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">同步与备份</h2>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isOnline ? (
                    <Cloud className="h-6 w-6 text-green-600" />
                  ) : (
                    <CloudOff className="h-6 w-6 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {isOnline ? '在线' : '离线'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isOnline 
                        ? '您的数据正在自动同步' 
                        : '连接到互联网以启用同步'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                    syncStatus === 'success' ? 'bg-green-500' :
                    syncStatus === 'error' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-sm text-gray-600 capitalize">{syncStatus}</span>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-4">手动备份</h3>
              <p className="text-sm text-gray-600 mb-4">
                创建数据的手动备份，确保数据安全存储。
              </p>
              <button
                onClick={handleExportJSON}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>创建备份</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddCategory(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CategoryForm onClose={() => setShowAddCategory(false)} />
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingCategory(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CategoryForm 
              category={editingCategory} 
              onClose={() => setEditingCategory(null)} 
            />
          </div>
        </div>
      )}

      {showAddBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddBudget(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <BudgetForm onClose={() => setShowAddBudget(false)} />
          </div>
        </div>
      )}

      {editingBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingBudget(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <BudgetForm 
              budget={editingBudget} 
              onClose={() => setEditingBudget(null)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings