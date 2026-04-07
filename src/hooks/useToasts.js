import { useCallback, useState } from 'react'

const TOAST_LIFETIME_MS = 4500

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()

    setToasts((prev) => [...prev, { id, message, type }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, TOAST_LIFETIME_MS)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return {
    toasts,
    addToast,
    dismissToast,
  }
}
