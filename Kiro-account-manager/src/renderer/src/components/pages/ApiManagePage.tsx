import { useState, useEffect } from 'react'
import { Cloud, RefreshCw, Send, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAccountsStore } from '@/store/accounts'
import { Button, Input, Label, Card } from '../ui'

interface ApiConfig {
  url: string
  apiKey: string
}

export function ApiManagePage() {
  const { t } = useTranslation()
  const isEn = t('common.unknown') === 'Unknown'
  const accountsStore = useAccountsStore()
  
  // 将 Map 转换为数组
  const accounts = Array.from(accountsStore.accounts.values())
  
  const [apiConfig, setApiConfig] = useState<ApiConfig>({ url: '', apiKey: '' })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // 加载保存的配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const saved = await window.api.getApiConfig()
        if (saved) {
          setApiConfig(saved)
          checkApiStatus(saved.url, saved.apiKey)
        }
      } catch (error) {
        console.error('Failed to load API config:', error)
      }
    }
    loadConfig()
  }, [])

  // 检查 API 状态
  const checkApiStatus = async (url: string, apiKey: string) => {
    if (!url) {
      setApiStatus('offline')
      return
    }

    setApiStatus('checking')
    try {
      console.log('[ApiManage] Checking API status:', url)
      const result = await window.api.testApiConnection(url, apiKey)
      
      console.log('[ApiManage] Test result:', result)
      
      if (result.success) {
        console.log('[ApiManage] API is online')
        setApiStatus('online')
      } else {
        console.error('[ApiManage] API is offline:', result.error)
        setApiStatus('offline')
      }
    } catch (error) {
      console.error('[ApiManage] Health check error:', error)
      setApiStatus('offline')
    }
  }

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const result = await window.api.saveApiConfig(apiConfig)
      if (result.success) {
        setSyncStatus('success')
        setSyncMessage(isEn ? 'Configuration saved successfully' : '配置保存成功')
        checkApiStatus(apiConfig.url, apiConfig.apiKey)
      } else {
        setSyncStatus('error')
        setSyncMessage(result.error || 'Failed to save configuration')
      }
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (error) {
      setSyncStatus('error')
      setSyncMessage(error instanceof Error ? error.message : 'Failed to save configuration')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  // 同步账号到 API
  const handleSyncAccounts = async () => {
    if (!apiConfig.url || !apiConfig.apiKey) {
      setSyncStatus('error')
      setSyncMessage(isEn ? 'Please configure API URL and Key first' : '请先配置 API 地址和密钥')
      setTimeout(() => setSyncStatus('idle'), 3000)
      return
    }

    setIsSyncing(true)
    setSyncStatus('idle')

    try {
      console.log('[ApiManage] Syncing accounts to:', apiConfig.url)
      console.log('[ApiManage] Account count:', accounts.length)
      
      // 过滤掉没有 accessToken 的账号
      const validAccounts = accounts.filter(acc => acc.credentials?.accessToken)
      
      if (validAccounts.length === 0) {
        setSyncStatus('error')
        setSyncMessage(isEn ? 'No valid accounts to sync' : '没有有效的账号可同步')
        setTimeout(() => setSyncStatus('idle'), 3000)
        setIsSyncing(false)
        return
      }
      
      console.log('[ApiManage] Valid accounts:', validAccounts.length)
      
      const result = await window.api.syncAccountsToApi(
        apiConfig.url,
        apiConfig.apiKey,
        validAccounts.map(acc => ({
          id: acc.id,
          email: acc.email,
          accessToken: acc.credentials.accessToken,
          refreshToken: acc.credentials.refreshToken,
          clientId: acc.credentials.clientId,
          clientSecret: acc.credentials.clientSecret,
          region: acc.credentials.region,
          // 标准化 authMethod 为小写
          authMethod: acc.credentials.authMethod?.toLowerCase() as 'idc' | 'social' | undefined,
          provider: acc.credentials.provider,
          profileArn: acc.credentials.profileArn,
          expiresAt: acc.credentials.expiresAt
        }))
      )

      console.log('[ApiManage] Sync result:', result)

      if (result.success) {
        const data = result.data as { count: number }
        setLastSyncTime(Date.now())
        setSyncStatus('success')
        setSyncMessage(isEn 
          ? `Successfully synced ${data.count} accounts` 
          : `成功同步 ${data.count} 个账号`
        )
      } else {
        setSyncStatus('error')
        setSyncMessage(result.error || 'Sync failed')
      }
      
      setTimeout(() => setSyncStatus('idle'), 5000)
    } catch (error) {
      console.error('[ApiManage] Sync error:', error)
      setSyncStatus('error')
      const errorMsg = error instanceof Error ? error.message : 'Sync failed'
      setSyncMessage(errorMsg)
      setTimeout(() => setSyncStatus('idle'), 5000)
    } finally {
      setIsSyncing(false)
    }
  }

  // 测试连接
  const handleTestConnection = async () => {
    if (!apiConfig.url) {
      setSyncStatus('error')
      setSyncMessage(isEn ? 'Please enter API URL' : '请输入 API 地址')
      setTimeout(() => setSyncStatus('idle'), 3000)
      return
    }

    setSyncStatus('idle')
    setApiStatus('checking')
    
    try {
      console.log('[ApiManage] Testing connection to:', apiConfig.url)
      const result = await window.api.testApiConnection(apiConfig.url, apiConfig.apiKey)
      
      console.log('[ApiManage] Test result:', result)
      
      if (result.success) {
        const data = result.data as { version?: string; status?: string }
        setApiStatus('online')
        setSyncStatus('success')
        setSyncMessage(isEn 
          ? `Connection successful! Server version: ${data.version || 'unknown'}` 
          : `连接成功！服务器版本: ${data.version || '未知'}`
        )
      } else {
        setApiStatus('offline')
        setSyncStatus('error')
        setSyncMessage(isEn 
          ? `Connection failed: ${result.error || 'Unknown error'}` 
          : `连接失败: ${result.error || '未知错误'}`
        )
      }
    } catch (error) {
      console.error('[ApiManage] Test connection error:', error)
      setApiStatus('offline')
      setSyncStatus('error')
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setSyncMessage(isEn 
        ? `Connection failed: ${errorMsg}` 
        : `连接失败: ${errorMsg}`
      )
    }
    
    setTimeout(() => setSyncStatus('idle'), 5000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Cloud className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {isEn ? 'API Management' : 'API 管理'}
            </h1>
            <p className="text-muted-foreground">
              {isEn 
                ? 'Configure and sync accounts to standalone API server'
                : '配置并同步账号到独立 API 服务器'
              }
            </p>
          </div>
        </div>
      </div>

      {/* API 配置 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEn ? 'API Configuration' : 'API 配置'}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' :
              apiStatus === 'offline' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            <span className="text-sm text-muted-foreground">
              {apiStatus === 'online' ? (isEn ? 'Online' : '在线') :
               apiStatus === 'offline' ? (isEn ? 'Offline' : '离线') :
               (isEn ? 'Checking...' : '检查中...')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">
              {isEn ? 'API URL' : 'API 地址'}
            </Label>
            <Input
              id="api-url"
              type="url"
              placeholder="http://localhost:5580"
              value={apiConfig.url}
              onChange={(e) => setApiConfig({ ...apiConfig, url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {isEn 
                ? 'The URL of your deployed Kiro Proxy API server'
                : '您部署的 Kiro Proxy API 服务器地址'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">
              {isEn ? 'API Key' : 'API 密钥'}
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder={isEn ? 'Enter API key' : '输入 API 密钥'}
              value={apiConfig.apiKey}
              onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {isEn 
                ? 'The API key configured in your server\'s .env file'
                : '服务器 .env 文件中配置的 API 密钥'
              }
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveConfig} className="flex-1">
              {isEn ? 'Save Configuration' : '保存配置'}
            </Button>
            <Button onClick={handleTestConnection} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {isEn ? 'Test' : '测试'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 账号同步 */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {isEn ? 'Account Synchronization' : '账号同步'}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">
                {isEn ? 'Local Accounts' : '本地账号'}
              </p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} {isEn ? 'accounts' : '个账号'}
              </p>
            </div>
            <Button
              onClick={handleSyncAccounts}
              disabled={isSyncing || !apiConfig.url || !apiConfig.apiKey}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isEn ? 'Syncing...' : '同步中...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {isEn ? 'Sync to API' : '同步到 API'}
                </>
              )}
            </Button>
          </div>

          {lastSyncTime && (
            <p className="text-sm text-muted-foreground">
              {isEn ? 'Last synced: ' : '上次同步: '}
              {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}

          {syncStatus !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              syncStatus === 'success' ? 'bg-green-500/10 text-green-600' :
              'bg-red-500/10 text-red-600'
            }`}>
              {syncStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{syncMessage}</span>
            </div>
          )}
        </div>
      </Card>

      {/* 使用说明 */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {isEn ? 'Usage Guide' : '使用说明'}
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {isEn 
              ? '1. Deploy the Kiro Proxy API server (see Kiro-proxy-api folder)'
              : '1. 部署 Kiro Proxy API 服务器（参见 Kiro-proxy-api 文件夹）'
            }
          </p>
          <p>
            {isEn 
              ? '2. Configure the API URL and Key above'
              : '2. 在上方配置 API 地址和密钥'
            }
          </p>
          <p>
            {isEn 
              ? '3. Click "Sync to API" to push your accounts to the server'
              : '3. 点击"同步到 API"将账号推送到服务器'
            }
          </p>
          <p>
            {isEn 
              ? '4. Use the API endpoints in your IDE or applications'
              : '4. 在 IDE 或应用中使用 API 端点'
            }
          </p>
        </div>
      </Card>
    </div>
  )
}
