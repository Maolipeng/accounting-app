import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import AIAssistant from './components/AIAssistant'
import { TransactionProvider } from './context/TransactionContext'
import { StorageProvider } from './context/StorageContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth />
  }

  return children
}

// 主应用内容
function AppContent() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Auth />
  }

  return (
    <ToastProvider>
      <StorageProvider>
        <TransactionProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <AIAssistant />
          </div>
        </TransactionProvider>
      </StorageProvider>
    </ToastProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
