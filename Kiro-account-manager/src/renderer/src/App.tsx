import React, { useState, useEffect } from 'react'
import { AccountManager } from './components/accounts'
import { Sidebar, type PageType } from './components/layout'
import { HomePage, AboutPage, SettingsPage, MachineIdPage, KiroSettingsPage, ProxyPage } from './components/pages'
import { UpdateDialog } from './components/UpdateDialog'
import { ToastContainer } from './components/ui'
import { useAccountsStore } from './store/accounts'
import { useToast } from './hooks/useToast'

// 创建全局Toast上下文
export const ToastContext = React.createContext<ReturnType<typeof useToast> | null>(null)

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  
  const toast = useToast()
  const { loadFromStorage, startAutoTokenRefresh, cleanup, handleBackgroundRefreshResult, handleBackgroundCheckResult } = useAccountsStore()
  
  // 应用启动时加载数据并启动自动刷新
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('[App] Initializing application...')
        await loadFromStorage()
        console.log('[App] Data loaded successfully')
        startAutoTokenRefresh()
        console.log('[App] Auto token refresh started')
        setIsInitializing(false)
        toast.success('应用启动成功', 'Application initialized successfully')
      } catch (error) {
        console.error('[App] Failed to initialize:', error)
        const errorMsg = error instanceof Error ? error.message : '应用初始化失败'
        setInitError(errorMsg)
        setIsInitializing(false)
        toast.error('初始化失败', errorMsg)
      }
    }
    
    initApp()
    
    // 清理函数：应用卸载时清理所有定时器
    return () => {
      console.log('[App] Cleaning up resources...')
      cleanup()
    }
  }, [loadFromStorage, startAutoTokenRefresh, cleanup, toast])

  // 监听后台刷新结果
  useEffect(() => {
    const unsubscribe = window.api.onBackgroundRefreshResult((data) => {
      handleBackgroundRefreshResult(data)
    })
    return () => {
      unsubscribe()
    }
  }, [handleBackgroundRefreshResult])

  // 监听后台检查结果
  useEffect(() => {
    const unsubscribe = window.api.onBackgroundCheckResult((data) => {
      handleBackgroundCheckResult(data)
    })
    return () => {
      unsubscribe()
    }
  }, [handleBackgroundCheckResult])

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'accounts':
        return <AccountManager />
      case 'machineId':
        return <MachineIdPage />
      case 'kiroSettings':
        return <KiroSettingsPage />
      case 'proxy':
        return <ProxyPage />
      case 'settings':
        return <SettingsPage />
      case 'about':
        return <AboutPage />
      default:
        return <HomePage />
    }
  }

  // 显示加载状态
  if (isInitializing) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">正在加载应用...</p>
        </div>
      </div>
    )
  }

  // 显示错误状态
  if (initError) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="text-destructive text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold">应用初始化失败</h2>
          <p className="text-muted-foreground">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <ToastContext.Provider value={toast}>
      <div className="h-screen bg-background flex">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
        <UpdateDialog />
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </div>
    </ToastContext.Provider>
  )
}

export default App
