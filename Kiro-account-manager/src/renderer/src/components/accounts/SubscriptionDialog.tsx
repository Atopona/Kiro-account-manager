import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../ui'
import { X, ExternalLink, CreditCard, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account } from '@/types/account'

interface SubscriptionDialogProps {
  account: Account
  isOpen: boolean
  onClose: () => void
  isEn: boolean
}

export const SubscriptionDialog = ({ account, isOpen, onClose, isEn }: SubscriptionDialogProps) => {
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState<Array<{
    name: string
    qSubscriptionType: string
    description: { title: string; billingInterval: string; featureHeader: string; features: string[] }
    pricing: { amount: number; currency: string }
  }>>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<string | null>(null)

  // 加载订阅计划
  const loadSubscriptionPlans = async () => {
    if (subscriptionLoading || !account.credentials?.accessToken) return
    
    setSubscriptionLoading(true)
    try {
      const result = await window.api.accountGetSubscriptions(account.credentials.accessToken)
      if (result.success && result.plans.length > 0) {
        setSubscriptionPlans(result.plans)
        const currentType = account.subscription?.type?.toUpperCase() || ''
        const isFirstTime = currentType === '' || currentType.includes('FREE')
        setIsFirstTimeUser(isFirstTime)
      } else {
        console.error('[SubscriptionDialog] Failed to get subscriptions:', result.error)
      }
    } catch (error) {
      console.error('[SubscriptionDialog] Error loading subscriptions:', error)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  // 选择订阅计划
  const handleSelectPlan = async (planName: string) => {
    if (paymentLoading || !account.credentials?.accessToken) return
    
    setSelectedPlan(planName)
    setPaymentLoading(true)
    setSubscriptionError(null)
    try {
      const result = await window.api.accountGetSubscriptionUrl(account.credentials.accessToken, planName)
      if (result.success && result.url) {
        await navigator.clipboard.writeText(result.url)
        setSubscriptionSuccess(isEn ? 'Link copied to clipboard!' : '链接已复制到剪贴板！')
        const urlToOpen = result.url
        setTimeout(async () => {
          onClose()
          setSubscriptionSuccess(null)
          await window.api.openSubscriptionWindow(urlToOpen)
        }, 800)
      } else {
        const errorMsg = result.error || (isEn ? 'Failed to get payment URL' : '获取支付链接失败')
        setSubscriptionError(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (isEn ? 'Unknown error' : '未知错误')
      setSubscriptionError(errorMsg)
    } finally {
      setPaymentLoading(false)
      setSelectedPlan(null)
    }
  }

  // 管理订阅
  const handleManageSubscription = async () => {
    if (paymentLoading || !account.credentials?.accessToken) return
    
    setPaymentLoading(true)
    setSubscriptionError(null)
    try {
      const result = await window.api.accountGetSubscriptionUrl(account.credentials.accessToken)
      if (result.success && result.url) {
        onClose()
        await window.api.openSubscriptionWindow(result.url)
      } else {
        const errorMsg = result.error || (isEn ? 'Failed to get management URL' : '获取管理链接失败')
        setSubscriptionError(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (isEn ? 'Unknown error' : '未知错误')
      setSubscriptionError(errorMsg)
    } finally {
      setPaymentLoading(false)
    }
  }

  // 打开时加载计划
  useState(() => {
    if (isOpen) {
      loadSubscriptionPlans()
    }
  })

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-2xl m-4 animate-in fade-in zoom-in-95 duration-200 border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-500/10">
          <div className="flex items-center gap-2 text-primary">
            <CreditCard className="h-5 w-5" />
            <span className="font-bold">{isEn ? (isFirstTimeUser ? 'Choose Your Plan' : 'Subscription Plans') : (isFirstTimeUser ? '选择订阅计划' : '订阅计划')}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {isFirstTimeUser && (
            <div className="text-xs text-muted-foreground mb-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-lg">
              {isEn ? 'Please select a subscription plan to continue.' : '请选择一个订阅计划以继续使用。'}
            </div>
          )}
          
          {!isFirstTimeUser && (
            <div className="text-xs text-muted-foreground mb-2">
              {isEn ? 'Current subscription: ' : '当前订阅: '}
              <span className="font-medium text-foreground">{account.subscription?.title || account.subscription?.type || 'Free'}</span>
            </div>
          )}
          
          {subscriptionError && (
            <div className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 p-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{subscriptionError}</span>
            </div>
          )}
          
          {subscriptionSuccess && (
            <div className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 p-2 rounded-lg flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{subscriptionSuccess}</span>
            </div>
          )}
          
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {subscriptionPlans.map((plan) => {
                const isCurrent = plan.name === account.subscription?.type || plan.description.title === account.subscription?.title
                const isLoading = paymentLoading && selectedPlan === plan.qSubscriptionType
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      'relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                      isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                      isLoading && 'opacity-70 cursor-wait'
                    )}
                    onClick={() => !isCurrent && handleSelectPlan(plan.qSubscriptionType)}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {isEn ? 'Current' : '当前'}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={cn('h-4 w-4', plan.pricing.amount === 0 ? 'text-green-500' : 'text-amber-500')} />
                      <span className="font-bold text-sm">{plan.description.title}</span>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {plan.pricing.amount === 0 ? (isEn ? 'Free' : '免费') : `${plan.pricing.amount}`}
                      {plan.pricing.amount > 0 && <span className="text-xs font-normal text-muted-foreground">/{plan.description.billingInterval}</span>}
                    </div>
                    <ul className="space-y-1.5">
                      {plan.description.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Button 
                        size="sm" 
                        className="w-full mt-3" 
                        variant={plan.pricing.amount === 0 ? 'outline' : 'default'}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{isEn ? 'Loading...' : '加载中...'}</>
                        ) : (
                          isEn ? 'Select' : '选择'
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={paymentLoading}
              className="text-xs"
            >
              {paymentLoading && !selectedPlan ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{isEn ? 'Loading...' : '加载中...'}</>
              ) : (
                <><ExternalLink className="h-3 w-3 mr-1" />{isEn ? 'Manage Billing' : '管理账单'}</>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              {isEn ? 'Close' : '关闭'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
