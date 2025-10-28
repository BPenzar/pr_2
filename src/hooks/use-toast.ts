import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
    const id = (toastCount++).toString()
    const newToast: Toast = { id, title, description, variant }

    setToasts((current) => [...current, newToast])

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((current) => current.filter(t => t.id !== id))
    }, duration)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter(t => t.id !== id))
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}