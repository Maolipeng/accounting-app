// AI服务模块 - 支持多个AI提供商
class AIService {
  constructor() {
    this.config = this.loadConfig()
  }

  loadConfig() {
    const saved = localStorage.getItem('ai_config')
    return saved ? JSON.parse(saved) : {
      provider: 'deepseek',
      apiKey: '',
      model: 'deepseek-chat',
      enabled: false
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    localStorage.setItem('ai_config', JSON.stringify(this.config))
  }

  isConfigured() {
    return this.config.enabled && this.config.apiKey
  }

  // 生成财务分析提示词
  generateFinancialPrompt(data) {
    const { transactions, categories, budgets } = data
    
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const balance = income - expense
    
    const expenseByCategory = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const categoryName = categories.find(c => c.id === t.category)?.name || t.category
      expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + t.amount
    })

    const prompt = `
作为一名专业的财务顾问，请分析以下财务数据并提供个性化建议：

财务概况：
- 总收入：¥${income.toLocaleString()}
- 总支出：¥${expense.toLocaleString()}
- 净余额：¥${balance.toLocaleString()}
- 储蓄率：${income > 0 ? ((balance / income) * 100).toFixed(1) : 0}%

支出分类明细：
${Object.entries(expenseByCategory).map(([category, amount]) => 
  `- ${category}：¥${amount.toLocaleString()}`
).join('\n')}

预算情况：
${budgets.length > 0 ? budgets.map(budget => {
  const spent = transactions
    .filter(t => t.type === 'expense' && (budget.category === 'all' || t.category === budget.category))
    .reduce((sum, t) => sum + t.amount, 0)
  const usage = ((spent / budget.amount) * 100).toFixed(1)
  return `- ${budget.name}：已使用${usage}% (¥${spent.toLocaleString()}/¥${budget.amount.toLocaleString()})`
}).join('\n') : '- 暂未设置预算'}

请提供：
1. 财务状况总体评价
2. 支出结构分析
3. 具体的改进建议
4. 储蓄和投资建议

请用简洁、实用的中文回答，重点关注可操作的建议。
`
    return prompt
  }

  async callAPI(messages, onChunk = null) {
    let apiUrl = ''
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    }
    let body = {}

    const systemPrompt = '你是一位专业的财务顾问，擅长分析个人财务数据并提供实用的理财建议。请用简洁、专业的中文回答。'
    const userMessage = messages[messages.length - 1].content

    // 是否启用流式响应
    const isStreaming = onChunk !== null

    switch (this.config.provider) {
      case 'deepseek':
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        body = {
          model: this.config.model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1024,
          stream: isStreaming
        };
        break;
      case 'moonshot':
        apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
        body = {
          model: this.config.model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1024,
          stream: isStreaming
        };
        break;
      case 'openai':
      case 'azure':
        apiUrl = this.config.provider === 'azure' 
          ? `YOUR_AZURE_ENDPOINT/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=2023-05-15`
          : 'https://api.openai.com/v1/chat/completions';
        if (this.config.provider === 'azure') {
          headers = { 'Content-Type': 'application/json', 'api-key': this.config.apiKey };
          delete headers.Authorization;
        }
        body = {
          model: this.config.model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1024,
          stream: isStreaming
        };
        break;
      case 'anthropic':
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        };
        body = {
          model: this.config.model,
          messages: [{ role: 'user', content: `${systemPrompt}\n\n${userMessage}` }],
          max_tokens: 1024,
          stream: isStreaming
        };
        break;
      case 'google':
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        headers = { 'Content-Type': 'application/json' };
        body = {
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
          }]
        };
        // Google API 不支持流式响应，强制关闭
        break;
      default:
        throw new Error(`不支持的AI服务提供商: ${this.config.provider}`);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '请求失败');
    }

    // 处理流式响应
    if (isStreaming && this.config.provider !== 'google') {
      return this.handleStreamResponse(response, onChunk);
    }

    // 处理非流式响应
    const data = await response.json();
    switch (this.config.provider) {
      case 'anthropic':
        return data.content[0].text;
      case 'google':
        return data.candidates[0].content.parts[0].text;
      default:
        return data.choices[0].message.content;
    }
  }

  async handleStreamResponse(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              let content = '';

              // 根据不同提供商解析内容
              switch (this.config.provider) {
                case 'anthropic':
                  if (parsed.delta?.text) {
                    content = parsed.delta.text;
                  }
                  break;
                default: // OpenAI, DeepSeek, Moonshot
                  if (parsed.choices?.[0]?.delta?.content) {
                    content = parsed.choices[0].delta.content;
                  }
                  break;
              }

              if (content) {
                fullContent += content;
                onChunk(content, fullContent);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  async analyzeFinancialData(data) {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置或未启用');
    }
    const prompt = this.generateFinancialPrompt(data);
    const messages = [{ role: 'user', content: prompt }];
    
    try {
      const response = await this.callAPI(messages);
      this.updateUsageStats();
      return response;
    } catch (error) {
      console.error('AI分析失败:', error);
      throw error;
    }
  }

  async askQuestion(question, context = '', onChunk = null) {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置或未启用');
    }
    const prompt = context 
      ? `基于以下财务背景信息：\n${context}\n\n用户问题：${question}`
      : `用户财务问题：${question}`;
    const messages = [{ role: 'user', content: prompt }];

    try {
      const response = await this.callAPI(messages, onChunk);
      this.updateUsageStats();
      return response;
    } catch (error) {
      console.error('AI问答失败:', error);
      throw error;
    }
  }

  updateUsageStats() {
    const stats = JSON.parse(localStorage.getItem('ai_usage_stats') || '{"monthly": 0, "total": 0, "lastMonth": ""}');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (stats.lastMonth !== currentMonth) {
      stats.monthly = 0;
      stats.lastMonth = currentMonth;
    }
    
    stats.monthly += 1;
    stats.total += 1;
    
    localStorage.setItem('ai_usage_stats', JSON.stringify(stats));
  }

  getUsageStats() {
    const stats = JSON.parse(localStorage.getItem('ai_usage_stats') || '{"monthly": 0, "total": 0, "lastMonth": ""}');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (stats.lastMonth !== currentMonth) {
      stats.monthly = 0;
    }
    
    return stats;
  }

  async testConnection() {
    if (!this.config.apiKey) {
      throw new Error('请先配置API密钥');
    }
    try {
      await this.askQuestion('请简单回复"连接成功"');
      return true;
    } catch (error) {
      throw new Error(`连接测试失败: ${error.message}`);
    }
  }
}

const aiService = new AIService();
export default aiService;