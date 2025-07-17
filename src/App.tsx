import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Dashboard } from './pages/Dashboard'
import { MCPManager } from './pages/MCPManager'
import { ChatExtraction } from './pages/ChatExtraction'
import { ApiDocs } from './pages/ApiDocs'
import { ApiKeys } from './pages/ApiKeys'
import { SharedConversation } from './pages/SharedConversation'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { LoadingScreen } from './components/LoadingScreen'
import { Toaster } from 'sonner'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chat History Manager</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Unify and manage your AI conversations across all platforms with our powerful API
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header user={user} />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mcp-manager" element={<MCPManager />} />
                <Route path="/chat-extraction" element={<ChatExtraction />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/api-keys" element={<ApiKeys />} />
                <Route path="/shared/:token" element={<SharedConversation />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster />
      </div>
    </Router>
  )
}

export default App