import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot, TrendingUp, DollarSign, PieChart, Loader } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import { useStorage } from '../context/StorageContext'
import aiService from '../services/aiService'

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [conversation, setConversation] = useState([
    { 
      id: 1,
      sender: 'ai', 
      message: '你好！我是你的AI财务助手。我可以帮你分析财务数据，提供建议，或回答你的问题。',
      timestamp: new Date(),
      isStreaming: false
    }
  ])
  const [streamingMessageId, setStreamingMessageId] = useState(null)
  const messagesEndRef = useRef(null)
  
  const { transactions, categories, budgets } = useTransactions()
  const { getAIInsights, getFinancialAdvice, analyzeSpendingPatterns } = useStorage()
  
  const data = { transactions, categories, budgets }
  const insights = getAIInsights(data)
  const advice = getFinancialAdvice(data)
  const spendingPatterns = analyzeSpendingPatterns(data)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  // 获取AI分析
  const getAIAnalysis = async () => {
    if (!aiService.isConfigured()) {
      return
    }

    setIsLoading(true)
    try {
      const analysis = await aiService.analyzeFinancialData(data)
      setAiAnalysis(analysis)
    } catch (error) {
      console.error('AI分析失败:', error)
      setAiAnalysis('AI分析暂时不可用：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 组件加载时获取AI分析，但只在必要时请求
  useEffect(() => {
    // 只有当面板打开、在洞察标签页、没有现有分析且有交易数据时才请求
    if (isOpen && activeTab === 'insights' && !aiAnalysis && transactions.length > 0 && !isLoading) {
      getAIAnalysis()
    }
  }, [isOpen, activeTab]) // 只在面板打开或标签切换时触发
  
  // 预定义的问题和回答
  const predefinedQA = {
    '如何节省更多钱': '节省更多钱的方法包括：\n\n1️⃣ **制定详细预算**并严格遵守\n2️⃣ **减少非必要支出**，区分需要和想要\n3️⃣ **自动储蓄**，设置自动转账到储蓄账户\n4️⃣ **比较价格**并寻找折扣优惠\n5️⃣ **减少订阅服务**，取消不常用的会员\n6️⃣ **考虑二手购物**，延长物品使用寿命',
    '如何开始投资': '开始投资的步骤：\n\n💰 **建立应急基金**（3-6个月生活费）\n📚 **学习投资知识**，了解股票、债券、基金等\n⚖️ **评估风险承受能力**\n📱 **选择投资平台**或咨询专业顾问\n💵 **从小额开始**，逐步增加投资金额\n⏰ **保持长期投资心态**，避免频繁交易',
    '如何制定预算': '制定预算的步骤：\n\n📊 **计算总收入**（税后收入）\n📝 **追踪所有支出**，记录每一笔花费\n🔍 **区分必要和非必要支出**\n📐 **使用50/30/20规则**：\n   • 50% 必需品（房租、食物等）\n   • 30% 个人支出（娱乐、购物等）\n   • 20% 储蓄和投资\n🎯 **为每个类别设置限额**\n🔄 **定期审查和调整**预算',
    '如何减少债务': '减少债务的策略：\n\n📋 **列出所有债务**（金额、利率、最低还款额）\n🎯 **优先偿还高利率债务**\n🔄 **考虑债务合并**，降低整体利率\n💬 **与债权人协商**更低的利率或还款计划\n💪 **增加还款额**，超过最低还款额\n🚫 **避免新增债务**\n❄️ **选择雪球法或雪崩法**还款策略',
    '如何提高收入': '提高收入的方法：\n\n💼 **在当前工作中争取加薪**或升职\n🎓 **发展新技能**，提升职业价值\n💻 **寻找副业**或自由职业机会\n🏠 **出租闲置资产**（房间、车位等）\n🛍️ **出售不需要的物品**\n💰 **投资被动收入来源**（股息、租金等）\n🔍 **考虑更换**薪资更高的工作'
  }
  
  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return
    
    const currentMessage = userMessage.trim()
    setUserMessage('')
    
    // 添加用户消息到对话
    const userMsgId = Date.now()
    setConversation(prev => [...prev, { 
      id: userMsgId,
      sender: 'user', 
      message: currentMessage,
      timestamp: new Date(),
      isStreaming: false
    }])
    
    setIsLoading(true)
    
    // 创建AI消息占位符
    const aiMsgId = Date.now() + 1
    setConversation(prev => [...prev, {
      id: aiMsgId,
      sender: 'ai',
      message: '',
      timestamp: new Date(),
      isStreaming: true
    }])
    setStreamingMessageId(aiMsgId)
    
    try {
      let reply = ''
      
      if (aiService.isConfigured()) {
        // 使用真实AI服务，支持流式响应
        const context = `
财务概况：
- 总收入：¥${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
- 总支出：¥${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
- 交易记录数：${transactions.length}
- 分类数：${categories.length}
- 预算数：${budgets.length}
        `
        
        // 调用流式API
        const messages = [{ role: 'user', content: currentMessage }]
        reply = await aiService.callAPI(messages, (chunk, fullContent) => {
          // 实时更新流式消息
          setConversation(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, message: fullContent, isStreaming: true }
              : msg
          ))
        })
      } else {
        // 使用预定义回答作为后备，模拟流式效果
        reply = '我不确定如何回答这个问题。请在设置中配置AI服务以获得更智能的回答。'
        
        // 检查是否匹配预定义问题
        for (const [question, answer] of Object.entries(predefinedQA)) {
          if (currentMessage.toLowerCase().includes(question.toLowerCase())) {
            reply = answer
            break
          }
        }
        
        // 如果包含特定关键词，提供相应回答
        if (currentMessage.toLowerCase().includes('预算')) {
          reply = '💡 **设置预算的重要性**\n\n设置预算是管理财务的关键。尝试使用**50/30/20规则**：\n• 50%用于必需品\n• 30%用于个人支出\n• 20%用于储蓄和投资\n\n这样可以帮助您更好地控制支出并增加储蓄。'
        } else if (currentMessage.toLowerCase().includes('储蓄')) {
          reply = '💰 **增加储蓄的策略**\n\n增加储蓄的好方法是**自动转账**一部分收入到专门的储蓄账户。理想情况下应该储蓄至少**20%的收入**。\n\n建议设置多个储蓄目标：\n• 应急基金\n• 短期目标\n• 长期投资'
        } else if (currentMessage.toLowerCase().includes('投资')) {
          reply = '📈 **投资入门建议**\n\n投资前应该先建立**应急基金**。对于初学者，考虑**低成本指数基金**是一个不错的开始。\n\n重要原则：\n• 分散投资以降低风险\n• 长期持有\n• 定期定额投资\n• 不要把所有鸡蛋放在一个篮子里'
        } else if (currentMessage.toLowerCase().includes('分析') || currentMessage.toLowerCase().includes('数据')) {
          reply = `📊 **您的财务分析**\n\n${advice}\n\n建议定期查看财务数据，及时调整支出策略。`
        }
        
        // 模拟流式效果
        const words = reply.split('')
        let currentText = ''
        for (let i = 0; i < words.length; i++) {
          currentText += words[i]
          setConversation(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, message: currentText, isStreaming: true }
              : msg
          ))
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      }
      
      // 完成流式响应
      setConversation(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, message: reply, isStreaming: false }
          : msg
      ))
    } catch (error) {
      console.error('AI回复失败:', error)
      setConversation(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { 
              ...msg, 
              message: `❌ 抱歉，我暂时无法回答您的问题：${error.message}`,
              isStreaming: false,
              isError: true
            }
          : msg
      ))
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 格式化消息内容
  const formatMessage = (message) => {
    // 处理换行
    const lines = message.split('\n')
    return lines.map((line, index) => {
      // 处理粗体文本 **text**
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = line.split(boldRegex)
      
      return (
        <div key={index} className={index > 0 ? 'mt-2' : ''}>
          {parts.map((part, partIndex) => {
            if (partIndex % 2 === 1) {
              return <strong key={partIndex} className="font-semibold">{part}</strong>
            }
            return part
          })}
        </div>
      )
    })
  }
  
  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-32 right-6 md:bottom-6 md:right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 z-40"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      
      {/* AI助手面板 */}
      {isOpen && (
        <div className="fixed bottom-32 right-6 md:bottom-6 md:right-6 w-80 sm:w-96 bg-white rounded-lg shadow-xl flex flex-col z-50 max-h-[55vh] md:max-h-[80vh] border border-gray-200">
          {/* 头部 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-medium">AI财务助手</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* 标签页 */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              洞察
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              分析
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              聊天
            </button>
          </div>
          
          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {/* 洞察标签页 */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                {/* AI分析结果 */}
                {aiService.isConfigured() && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Bot className="h-4 w-4 mr-2 text-blue-600" />
                        AI财务分析
                      </h4>
                      <button
                        onClick={getAIAnalysis}
                        disabled={isLoading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        {isLoading ? '分析中...' : '刷新分析'}
                      </button>
                    </div>
                    
                    {isLoading ? (
                      <div className="bg-white border border-blue-200 p-4 rounded-lg flex items-center justify-center">
                        <Loader className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                        <span className="text-sm text-gray-600">AI正在分析您的财务数据...</span>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="bg-white border border-blue-200 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {formatMessage(aiAnalysis)}
                        </div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">添加一些交易记录后，AI将为您提供个性化的财务分析。</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 基础洞察 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-yellow-600" />
                    基础洞察
                  </h4>
                  {insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div key={index} className="bg-white border border-yellow-200 p-3 rounded-lg mt-2 shadow-sm">
                        <p className="text-sm text-gray-800">{insight.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">暂无财务洞察。开始记录您的收支，以获取个性化分析。</p>
                    </div>
                  )}
                </div>
                
                {/* 基础建议 */}
                {!aiService.isConfigured() && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      财务建议
                    </h4>
                    <div className="bg-white border border-green-200 p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-800">{advice}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-2">
                      <p className="text-sm text-blue-700">
                        💡 在设置中配置AI服务，获得更智能、个性化的财务分析和建议！
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 分析标签页 */}
            {activeTab === 'analysis' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <PieChart className="h-4 w-4 mr-2 text-purple-600" />
                  支出分析
                </h4>
                {spendingPatterns.length > 0 ? (
                  <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                    {spendingPatterns.slice(0, 5).map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between mb-3 last:mb-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{pattern.icon}</span>
                          <span className="text-sm font-medium">{pattern.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">¥{pattern.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{pattern.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">主要支出类别</span>
                        <span className="text-sm text-blue-600 font-medium">
                          {spendingPatterns[0]?.category || '无数据'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">暂无支出数据。添加交易记录以查看分析。</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">常见问题</h4>
                  <div className="space-y-2">
                    {[
                      '如何节省更多钱？',
                      '如何开始投资？',
                      '如何制定预算？'
                    ].map((question, index) => (
                      <button 
                        key={index}
                        onClick={() => {
                          setActiveTab('chat')
                          setUserMessage(question.replace('？', ''))
                        }}
                        className="w-full text-left text-sm bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 p-3 rounded-lg transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 聊天标签页 */}
            {activeTab === 'chat' && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm leading-relaxed">
                        {msg.sender === 'ai' ? formatMessage(msg.message) : msg.message}
                      </div>
                      {msg.isStreaming && (
                        <div className="flex items-center mt-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* 聊天输入框 */}
          {activeTab === 'chat' && (
            <div className="p-3 border-t bg-white">
              {isLoading && (
                <div className="mb-2 flex items-center justify-center text-sm text-gray-500">
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  AI正在思考中...
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={aiService.isConfigured() ? "输入问题..." : "请先在设置中配置AI服务"}
                  disabled={isLoading}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim() || isLoading}
                  className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default AIAssistant