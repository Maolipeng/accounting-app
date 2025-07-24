// API基础配置
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
  : '/api'  // 开发环境使用代理

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('auth_token')
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  // 获取认证令牌
  getToken() {
    return this.token || localStorage.getItem('auth_token')
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // 添加认证头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API请求错误:', error)
      throw error
    }
  }

  // GET请求
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  // POST请求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT请求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // 认证相关API
  auth = {
    // 用户注册
    register: async (userData) => {
      return this.post('/auth/register', userData)
    },

    // 用户登录
    login: async (credentials) => {
      const response = await this.post('/auth/login', credentials)
      if (response.token) {
        this.setToken(response.token)
      }
      return response
    },

    // 获取当前用户信息
    me: async () => {
      return this.get('/auth/me')
    },

    // 更新用户资料
    updateProfile: async (profileData) => {
      return this.put('/auth/profile', profileData)
    },

    // 修改密码
    changePassword: async (passwordData) => {
      return this.put('/auth/password', passwordData)
    },

    // 登出
    logout: () => {
      this.setToken(null)
    }
  }

  // 交易记录相关API
  transactions = {
    // 获取交易记录列表
    list: async (params = {}) => {
      return this.get('/transactions', params)
    },

    // 获取单个交易记录
    get: async (id) => {
      return this.get(`/transactions/${id}`)
    },

    // 创建交易记录
    create: async (transactionData) => {
      return this.post('/transactions', transactionData)
    },

    // 更新交易记录
    update: async (id, transactionData) => {
      return this.put(`/transactions/${id}`, transactionData)
    },

    // 删除交易记录
    delete: async (id) => {
      return this.delete(`/transactions/${id}`)
    },

    // 获取统计数据
    getStats: async (params = {}) => {
      return this.get('/transactions/stats/summary', params)
    },
    
    // 获取趋势数据
    getTrend: async (params = {}) => {
      return this.get('/transactions/stats/trend', params)
    }
  }

  // 分类相关API
  categories = {
    // 获取分类列表
    list: async () => {
      return this.get('/categories')
    },

    // 获取单个分类
    get: async (id) => {
      return this.get(`/categories/${id}`)
    },

    // 创建分类
    create: async (categoryData) => {
      return this.post('/categories', categoryData)
    },

    // 更新分类
    update: async (id, categoryData) => {
      return this.put(`/categories/${id}`, categoryData)
    },

    // 删除分类
    delete: async (id) => {
      return this.delete(`/categories/${id}`)
    },

    // 获取分类统计
    getStats: async (id) => {
      return this.get(`/categories/${id}/stats`)
    }
  }

  // 预算相关API
  budgets = {
    // 获取预算列表
    list: async (params = {}) => {
      return this.get('/budgets', params)
    },

    // 获取单个预算
    get: async (id) => {
      return this.get(`/budgets/${id}`)
    },

    // 创建预算
    create: async (budgetData) => {
      return this.post('/budgets', budgetData)
    },

    // 更新预算
    update: async (id, budgetData) => {
      return this.put(`/budgets/${id}`, budgetData)
    },

    // 删除预算
    delete: async (id) => {
      return this.delete(`/budgets/${id}`)
    },

    // 获取预算概览
    getOverview: async () => {
      return this.get('/budgets/overview/summary')
    }
  }

  // 用户相关API
  users = {
    // 获取用户统计
    getStats: async () => {
      return this.get('/users/stats')
    },

    // 导出用户数据
    exportData: async (params = {}) => {
      return this.get('/users/export', params)
    },

    // 导入用户数据
    importData: async (data) => {
      return this.post('/users/import', data)
    },

    // 删除账户
    deleteAccount: async (confirmationData) => {
      return this.delete('/users/account', confirmationData)
    },

    // 获取活动日志
    getActivity: async () => {
      return this.get('/users/activity')
    }
  }
}

// 创建API服务实例
const apiService = new ApiService()

export default apiService