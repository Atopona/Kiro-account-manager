import { createPortal } from 'react-dom'
import Toast, { type ToastMessage } from './Toast'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>,
    document.body
  )
}

export default ToastContainer
