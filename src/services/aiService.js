class AIService {
  constructor() {
    this.config = {
      provider: 'deepseek',
      apiKey: '',
      model: 'deepseek-chat',
      enabled: false
    }
    this.zhipuConfig = {
      apiKey: '',
      model: 'glm-4v',
      enabled: false
    }
    this.loadConfig()
  }

  // 加载配置
  loadConfig() {
    try {
      const saved = localStorage.getItem('aiConfig')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
      const savedZhipu = localStorage.getItem('zhipuConfig')
      if (savedZhipu) {
        let loadedZhipuConfig = JSON.parse(savedZhipu);
        // 迁移旧的错误模型配置
        if (loadedZhipuConfig.model === 'GLM-4-Flash-250414') {
          loadedZhipuConfig.model = 'glm-4v';
          localStorage.setItem('zhipuConfig', JSON.stringify(loadedZhipuConfig));
        }
        this.zhipuConfig = { ...this.zhipuConfig, ...loadedZhipuConfig }
      }
    } catch (error) {
      console.error('加载AI配置失败:', error)
    }
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    localStorage.setItem('aiConfig', JSON.stringify(this.config))
  }

  // 更新智谱AI配置
  updateZhipuConfig(newConfig) {
    this.zhipuConfig = { ...this.zhipuConfig, ...newConfig }
    localStorage.setItem('zhipuConfig', JSON.stringify(this.zhipuConfig))
  }

  // 检查是否已配置
  isConfigured() {
    return this.config.enabled && this.config.apiKey && this.config.provider
  }

  // 获取API端点
  getApiEndpoint() {
    const endpoints = {
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      moonshot: 'https://api.moonshot.cn/v1/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      google: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      azure: `${this.config.endpoint || 'https://your-resource.openai.azure.com'}/openai/deployments/${this.config.deploymentName || 'gpt-35-turbo'}/chat/completions?api-version=2023-12-01-preview`
    }
    return endpoints[this.config.provider]
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }

    switch (this.config.provider) {
      case 'deepseek':
      case 'moonshot':
      case 'openai':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
        break
      case 'anthropic':
        headers['x-api-key'] = this.config.apiKey
        headers['anthropic-version'] = '2023-06-01'
        break
      case 'google':
        // Google使用URL参数传递API密钥
        break
      case 'azure':
        headers['api-key'] = this.config.apiKey
        break
    }

    return headers
  }

  // 格式化消息
  formatMessages(messages) {
    switch (this.config.provider) {
      case 'anthropic':
        return {
          model: this.config.model,
          max_tokens: 1000,
          messages: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }
      case 'google':
        return {
          contents: messages.map(msg => ({
            parts: [{ text: msg.content }],
            role: msg.role === 'user' ? 'user' : 'model'
          }))
        }
      default:
        return {
          model: this.config.model,
          messages: messages,
          stream: false
        }
    }
  }

  // 调用API
  async callAPI(messages, onChunk = null) {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置')
    }

    const endpoint = this.getApiEndpoint()
    const headers = this.getHeaders()
    const body = this.formatMessages(messages)

    // 如果有回调函数，启用流式响应
    if (onChunk && this.config.provider !== 'google' && this.config.provider !== 'anthropic') {
      body.stream = true
    }

    try {
      let url = endpoint
      if (this.config.provider === 'google') {
        url += `?key=${this.config.apiKey}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API请求失败: ${response.status} ${errorText}`)
      }

      // 处理流式响应
      if (onChunk && body.stream) {
        return await this.handleStreamResponse(response, onChunk)
      }

      // 处理普通响应
      const data = await response.json()
      return this.extractContent(data)
    } catch (error) {
      console.error('AI API调用失败:', error)
      throw new Error(`AI服务调用失败: ${error.message}`)
    }
  }

  // 处理流式响应
  async handleStreamResponse(response, onChunk) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = this.extractStreamContent(parsed)
              if (content) {
                fullContent += content
                onChunk(content, fullContent)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullContent
  }

  // 提取流式内容
  extractStreamContent(data) {
    if (data.choices && data.choices[0] && data.choices[0].delta) {
      return data.choices[0].delta.content || ''
    }
    return ''
  }

  // 提取响应内容
  extractContent(data) {
    switch (this.config.provider) {
      case 'anthropic':
        return data.content && data.content[0] ? data.content[0].text : '无响应内容'
      case 'google':
        return data.candidates && data.candidates[0] && data.candidates[0].content
          ? data.candidates[0].content.parts[0].text
          : '无响应内容'
      default:
        return data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : '无响应内容'
    }
  }

  // 智谱AI图片识别
  async recognizeImageWithZhipu(imageBase64, prompt = '请识别这张图片中的文字内容，特别是金额、商家名称、日期等信息') {
    // 强制从localStorage重新加载最新的配置，确保实时性
    const savedZhipu = localStorage.getItem('zhipuConfig');
    const zhipuConfig = savedZhipu ? JSON.parse(savedZhipu) : { model: 'glm-4v', enabled: false };
    
    if (!zhipuConfig.apiKey || !zhipuConfig.enabled) {
      throw new Error('智谱AI未配置或未启用')
    }

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${zhipuConfig.apiKey}`
        },
        body: JSON.stringify({
          model: zhipuConfig.model || 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`智谱AI请求失败: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '无法识别图片内容'
    } catch (error) {
      console.error('智谱AI图片识别失败:', error)
      throw new Error(`图片识别失败: ${error.message}`)
    }
  }

  // 图片文字识别（智能选择服务）
  async recognizeImage(imageBase64, prompt = '请识别这张图片中的文字内容，特别是金额、商家名称、日期等信息') {
    // 如果是DeepSeek，使用智谱AI进行图片识别
    if (this.config.provider === 'deepseek') {
      return await this.recognizeImageWithZhipu(imageBase64, prompt)
    }

    // 其他支持视觉的AI服务
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置')
    }

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ]

    return await this.callAPI(messages)
  }

  // 解析交易信息
  async parseTransactionFromText(text, categories = []) {
    const categoryNames = categories.map(cat => cat.name).join('、')
    
    const prompt = `
请从以下文本中提取交易信息，并以JSON格式返回。如果是图片识别的结果，请分析其中的交易信息。

文本内容：
${text}

可用分类：${categoryNames}

请返回JSON格式的交易数组，每个交易包含以下字段：
- type: "income" 或 "expense"
- amount: 数字（金额）
- category: 分类名称（从可用分类中选择最匹配的）
- description: 描述/备注
- date: 日期（YYYY-MM-DD格式，如果没有明确日期则使用今天）
- confidence: 置信度（0-1之间的数字，表示识别准确度）

示例格式：
[
  {
    "type": "expense",
    "amount": 25.50,
    "category": "餐饮",
    "description": "午餐 - 麦当劳",
    "date": "2024-01-15",
    "confidence": 0.9
  }
]

请只返回JSON数组，不要包含其他文字说明。
    `

    try {
      const response = await this.askQuestion(prompt)
      
      // 尝试解析JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const transactions = JSON.parse(jsonMatch[0])
        return Array.isArray(transactions) ? transactions : [transactions]
      }
      
      throw new Error('无法解析AI返回的交易信息')
    } catch (error) {
      console.error('解析交易信息失败:', error)
      throw new Error(`解析交易信息失败: ${error.message}`)
    }
  }

  // 问答接口
  async askQuestion(question, onChunk = null) {
    const messages = [{ role: 'user', content: question }]
    return await this.callAPI(messages, onChunk)
  }

  // 分析财务数据
  async analyzeFinancialData(data) {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置')
    }

    const { transactions, categories, budgets } = data
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    
    const prompt = `
作为专业的财务分析师，请分析以下财务数据并提供洞察和建议：

财务概况：
- 总收入：¥${totalIncome.toLocaleString()}
- 总支出：¥${totalExpense.toLocaleString()}
- 净收入：¥${(totalIncome - totalExpense).toLocaleString()}
- 交易记录数：${transactions.length}

分类统计：
${categories.map(cat => {
  const catTransactions = transactions.filter(t => t.category === cat.id)
  const catAmount = catTransactions.reduce((sum, t) => sum + t.amount, 0)
  return `- ${cat.name}：¥${catAmount.toLocaleString()} (${catTransactions.length}笔)`
}).join('\n')}

预算情况：
${budgets.map(budget => {
  const spent = transactions
    .filter(t => t.type === 'expense' && t.category === budget.categoryId)
    .reduce((sum, t) => sum + t.amount, 0)
  const percentage = budget.amount > 0 ? (spent / budget.amount * 100).toFixed(1) : 0
  return `- ${budget.categoryName}：已用¥${spent.toLocaleString()}/预算¥${budget.amount.toLocaleString()} (${percentage}%)`
}).join('\n')}

请提供：
1. 财务状况总体评价
2. 支出结构分析
3. 预算执行情况
4. 具体改进建议
5. 理财规划建议

请用中文回答，语言简洁专业。
    `

    return await this.askQuestion(prompt)
  }
}

// 创建单例实例
const aiService = new AIService()

// 导出解析交易文本的函数
export const parseTransactionText = async (text, categories = []) => {
  return await aiService.parseTransactionFromText(text, categories);
};

export default aiService
export { aiService }
