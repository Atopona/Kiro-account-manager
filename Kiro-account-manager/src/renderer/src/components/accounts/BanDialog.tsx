import { createPortal } from 'react-dom'
import { Button } from '../ui'
import { X, AlertCircle, ExternalLink } from 'lucide-react'

interface BanDialogProps {
  isOpen: boolean
  onClose: () => void
  email: string
  errorDetails: string
  isEn: boolean
}

export const BanDialog = ({ isOpen, onClose, email, errorDetails, isEn }: BanDialogProps) => {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-lg m-4 animate-in fade-in zoom-in-95 duration-200 border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-bold">{isEn ? 'Account Suspended' : '账户已封禁'}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{isEn ? 'Account' : '账户'}</label>
            <div className="text-sm font-medium">{email}</div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{isEn ? 'Error Details' : '错误详情'}</label>
            <div className="text-xs font-mono bg-muted/50 p-3 rounded-lg border break-all whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {errorDetails}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <a 
              href="https://support.aws.amazon.com/#/contacts/kiro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              {isEn ? 'Contact Support' : '联系支持'}
            </a>
            <Button size="sm" variant="outline" onClick={onClose}>
              {isEn ? 'Close' : '关闭'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
