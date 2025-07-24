import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import AIAssistant from './components/AIAssistant'
import { TransactionProvider } from './context/TransactionContext'
import { StorageProvider } from './context/StorageContext'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <StorageProvider>
        <TransactionProvider>
          <Router>
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
          </Router>
        </TransactionProvider>
      </StorageProvider>
    </ToastProvider>
  )
}

export default App