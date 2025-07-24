import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Receipt, BarChart3, Settings, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: '首页' },
    { path: '/transactions', icon: Receipt, label: '交易' },
    { path: '/statistics', icon: BarChart3, label: '统计' },
    { path: '/settings', icon: Settings, label: '设置' }
  ]

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                记账本
              </Link>
              <div className="flex space-x-6">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === path
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{user?.username}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user?.email}
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      账户设置
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md transition-colors ${
                location.pathname === path
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile User Menu Overlay */}
      {showUserMenu && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowUserMenu(false)}>
          <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">用户菜单</h3>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{user?.username}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  to="/settings"
                  className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  账户设置
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="hidden md:block fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  )
}