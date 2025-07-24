import React, { useState, useRef } from 'react'
import { Upload, Camera, FileText, X, Check, Edit, Loader, Sparkles } from 'lucide-react'
import { useTransactions } from '../context/TransactionContext'
import { useToast } from '../context/ToastContext'
import aiService from '../services/aiService'

const AIImport = ({ isOpen, onClose }) => {
  const { dispatch, categories } = useTransactions()
  const { showToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedTransactions, setExtractedTransactions] = useState([])
  const [inputText, setInputText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // 处理图片上传
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error')
      return
    }

    setSelectedImage(file)
    await processImage(file)
  }

  // 处理图片识别
  const processImage = async (imageFile) => {
    if (!aiService.isConfigured()) {
      showToast('请先在设置中配置AI服务', 'error')
      return
    }

    setIsProcessing(true)
    try {
      // 将图片转换为base64
      const base64Image = await convertImageToBase64(imageFile)
      
      // 调用AI服务进行OCR识别
      const extractedText = await aiService.recognizeImage(base64Image.split(',')[1])
      
      if (extractedText) {
        // 解析提取的文本
        await parseTransactionText(extractedText)
      } else {
        showToast('未能从图片中识别出文字内容', 'error')
      }
    } catch (error) {
      console.error('图片处理失败:', error)
      showError('图片处理失败：' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理文本输入
  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
      showWarning('请输入要解析的文本')
      return
    }

    if (!aiService.isConfigured()) {
      showWarning('请先在设置中配置AI服务')
      return
    }

    await parseTransactionText(inputText.trim())
  }

  // 解析交易文本
  const parseTransactionText = async (text) => {
    setIsProcessing(true)
    try {
      const prompt = `
请分析以下文本内容，提取其中的交易信息。如果是购物小票、账单或交易记录，请识别出：
1. 交易类型（收入/支出）
2. 金额
3. 商家或交易对象
4. 交易时间（如果有）
5. 商品或服务类别

文本内容：
${text}

请以JSON格式返回，格式如下：
{
  "transactions": [
    {
      "type": "expense", // 或 "income"
      "amount": 金额数字,
      "merchant": "商家名称",
      "category": "分类",
      "date": "YYYY-MM-DD",
      "description": "交易描述",
      "confidence": 0.9 // 识别置信度 0-1
    }
  ]
}

如果无法识别出交易信息，请返回空的transactions数组。
`

      const response = await aiService.askQuestion(prompt)
      
      // 尝试解析AI返回的JSON
      let parsedData
      try {
        // 提取JSON部分（可能包含在代码块中）
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response
        parsedData = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        showError('AI返回的数据格式无效，请重试')
        return
      }

      if (parsedData.transactions && parsedData.transactions.length > 0) {
        // 处理识别出的交易
        const processedTransactions = parsedData.transactions.map((transaction, index) => ({
          id: `ai_${Date.now()}_${index}`,
          type: transaction.type === 'income' ? 'income' : 'expense',
          amount: parseFloat(transaction.amount) || 0,
          merchant: transaction.merchant || '',
          category: mapCategoryName(transaction.category),
          date: transaction.date || new Date().toISOString().split('T')[0],
          description: transaction.description || '',
          confidence: transaction.confidence || 0.8,
          isAIGenerated: true
        })).filter(t => t.amount > 0)

        if (processedTransactions.length > 0) {
          setExtractedTransactions(processedTransactions)
          showSuccess(`成功识别出 ${processedTransactions.length} 条交易记录`)
        } else {
          showWarning('未能识别出有效的交易信息')
        }
      } else {
        showWarning('未能从文本中识别出交易信息')
      }
    } catch (error) {
      console.error('文本解析失败:', error)
      showError('文本解析失败：' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // 映射分类名称到系统分类
  const mapCategoryName = (categoryName) => {
    if (!categoryName) return 'other'
    
    const categoryMap = {
      '餐饮': 'food',
      '食物': 'food',
      '吃饭': 'food',
      '交通': 'transport',
      '出行': 'transport',
      '购物': 'shopping',
      '娱乐': 'entertainment',
      '医疗': 'healthcare',
      '教育': 'education',
      '工资': 'salary',
      '投资': 'investment'
    }

    const lowerCategoryName = categoryName.toLowerCase()
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerCategoryName.includes(key.toLowerCase())) {
        return value
      }
    }

    return 'other'
  }

  // 图片转base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 确认添加交易
  const confirmTransaction = (transaction) => {
    const categoryData = categories.find(c => c.id === transaction.category)
    const transactionData = {
      ...transaction,
      categoryName: categoryData?.name || transaction.category,
      note: `${transaction.description}${transaction.merchant ? ` - ${transaction.merchant}` : ''}`.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    dispatch({ type: 'ADD_TRANSACTION', payload: transactionData })
    
    // 从列表中移除已确认的交易
    setExtractedTransactions(prev => prev.filter(t => t.id !== transaction.id))
    showSuccess('交易记录已添加')
  }

  // 取消交易
  const cancelTransaction = (transactionId) => {
    setExtractedTransactions(prev => prev.filter(t => t.id !== transactionId))
  }

  // 编辑交易
  const editTransaction = (transaction) => {
    // 这里可以打开编辑对话框，暂时简化处理
    showWarning('编辑功能开发中，请先确认添加后再编辑')
  }

  // 清空所有数据
  const clearAll = () => {
    setExtractedTransactions([])
    setInputText('')
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-xl font-semibold">AI智能导入</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* 输入区域 */}
          <div className="space-y-6 mb-6">
            {/* 图片上传 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">上传图片识别</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">选择图片文件</p>
                    <p className="text-xs text-gray-500">支持小票、账单等</p>
                  </button>
                </div>
                
                <div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">拍照识别</p>
                    <p className="text-xs text-gray-500">直接拍摄小票</p>
                  </button>
                </div>
              </div>
              
              {selectedImage && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    已选择图片: {selectedImage.name}
                  </p>
                </div>
              )}
            </div>

            {/* 文本输入 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">文本解析</h3>
              <div className="space-y-3">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="粘贴或输入交易相关文本，如：&#10;- 购物小票内容&#10;- 转账记录&#10;- 消费明细等"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={isProcessing || !inputText.trim()}
                  className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>解析文本</span>
                </button>
              </div>
            </div>
          </div>

          {/* 处理状态 */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">AI正在分析中...</p>
              </div>
            </div>
          )}

          {/* 识别结果 */}
          {extractedTransactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  识别结果 ({extractedTransactions.length} 条)
                </h3>
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空全部
                </button>
              </div>
              
              <div className="space-y-3">
                {extractedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? '收入' : '支出'}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            ¥{transaction.amount.toLocaleString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.confidence >= 0.8 
                              ? 'bg-green-100 text-green-700'
                              : transaction.confidence >= 0.6
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            置信度: {Math.round(transaction.confidence * 100)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">分类:</span> {
                              categories.find(c => c.id === transaction.category)?.name || transaction.category
                            }
                          </div>
                          <div>
                            <span className="font-medium">日期:</span> {transaction.date}
                          </div>
                          {transaction.merchant && (
                            <div>
                              <span className="font-medium">商家:</span> {transaction.merchant}
                            </div>
                          )}
                          {transaction.description && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">描述:</span> {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => editTransaction(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmTransaction(transaction)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="确认添加"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => cancelTransaction(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="取消"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 批量操作 */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  请确认上述交易信息是否正确，然后选择添加或取消
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      extractedTransactions.forEach(confirmTransaction)
                    }}
                    className="btn btn-primary text-sm"
                  >
                    全部添加
                  </button>
                  <button
                    onClick={clearAll}
                    className="btn btn-secondary text-sm"
                  >
                    全部取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          {!isProcessing && extractedTransactions.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 上传购物小票、账单等图片，AI会自动识别交易信息</li>
                <li>• 粘贴转账记录、消费明细等文本，AI会提取交易数据</li>
                <li>• 识别结果会显示置信度，请仔细核对后再添加</li>
                <li>• 支持批量添加多条交易记录</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIImport