import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AiSettings = () => {
  const { showToast } = useToast();
  const [aiConfig, setAiConfig] = useState({
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    enabled: false,
    zhipuApiKey: '',
    zhipuModel: 'glm-4v',
    zhipuEnabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await api.get('/ai-config');
        if (data) {
          setAiConfig({
            provider: data.provider || 'deepseek',
            apiKey: data.apiKey ? '***' : '',
            model: data.model || 'deepseek-chat',
            enabled: data.enabled || false,
            zhipuApiKey: data.zhipuApiKey ? '***' : '',
            zhipuModel: data.zhipuModel || 'glm-4v',
            zhipuEnabled: data.zhipuEnabled || false,
          });
        }
      } catch (error) {
        showToast('加载AI配置失败', 'error');
      }
    };
    // 只在组件挂载时加载一次配置
    loadConfig();
  }, []);  // 移除 showToast 依赖，避免不必要的重新加载

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 如果用户未输入新密钥，则不更新
      const payload = { ...aiConfig };
      if (aiConfig.apiKey === '***') {
        delete payload.apiKey;
      }
      if (aiConfig.zhipuApiKey === '***') {
        delete payload.zhipuApiKey;
      }
      
      await api.post('/ai-config', payload);
      showToast('AI配置已保存', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || '保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">AI助手配置</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">服务商</label>
          <select
            value={aiConfig.provider}
            onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value })}
            className="input"
          >
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">API密钥</label>
          <input
            type="password"
            value={aiConfig.apiKey}
            onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
            className="input"
            placeholder="若不更改则无需输入"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="aiEnabled"
            checked={aiConfig.enabled}
            onChange={(e) => setAiConfig({ ...aiConfig, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="aiEnabled" className="ml-2 block text-sm text-gray-900">
            启用AI服务
          </label>
        </div>
        <hr />
        <h3 className="text-md font-semibold">智谱AI（图片识别）</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">智谱AI API密钥</label>
          <input
            type="password"
            value={aiConfig.zhipuApiKey}
            onChange={(e) => setAiConfig({ ...aiConfig, zhipuApiKey: e.target.value })}
            className="input"
            placeholder="若不更改则无需输入"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="zhipuEnabled"
            checked={aiConfig.zhipuEnabled}
            onChange={(e) => setAiConfig({ ...aiConfig, zhipuEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="zhipuEnabled" className="ml-2 block text-sm text-gray-900">
            启用图片识别
          </label>
        </div>
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full">
          {isSaving ? '保存中...' : '保存AI配置'}
        </button>
      </div>
    </div>
  );
};

export default AiSettings;