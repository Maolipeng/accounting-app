import React, { createContext, useContext, useReducer, useEffect } from 'react'
import apiService from '../services/api'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // 初始化时检查本地存储的token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          apiService.setToken(token)
          const response = await apiService.auth.me()
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.user,
              token
            }
          })
        } catch (error) {
          console.error('Token验证失败:', error)
          localStorage.removeItem('auth_token')
          apiService.setToken(null)
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initAuth()
  }, [])

  // 登录
  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await apiService.auth.login(credentials)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })

      return { success: true, user: response.user }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      return { success: false, error: error.message }
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await apiService.auth.register(userData)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })

      return { success: true, user: response.user }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      return { success: false, error: error.message }
    }
  }

  // 登出
  const logout = () => {
    apiService.auth.logout()
    dispatch({ type: 'LOGOUT' })
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.auth.updateProfile(profileData)
      dispatch({ type: 'UPDATE_USER', payload: response.user })
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 修改密码
  const changePassword = async (passwordData) => {
    try {
      await apiService.auth.changePassword(passwordData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内使用')
  }
  return context
}