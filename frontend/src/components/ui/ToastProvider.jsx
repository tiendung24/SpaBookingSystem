/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ToastContext = createContext(null)

function ToastItem({ toast, onClose }) {
  const base =
    toast.type === 'error'
      ? 'bg-red-50 border-red-200 text-red-900'
      : toast.type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
        : toast.type === 'warning'
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-slate-50 border-slate-200 text-slate-900'

  return (
    <div className={`w-[360px] max-w-[90vw] border shadow-lg rounded-xl px-4 py-3 ${base}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {toast.title ? <p className="font-bold text-sm">{toast.title}</p> : null}
          <p className="text-sm leading-snug">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="text-xs font-bold opacity-70 hover:opacity-100"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const pushToast = useCallback(({ message, title = '', type = 'info', durationMs = 5000 }) => {
    const id = crypto.randomUUID()
    const toast = { id, message, title, type, durationMs }
    setToasts((prev) => [toast, ...prev].slice(0, 5))
    if (durationMs > 0) {
      setTimeout(() => removeToast(id), durationMs)
    }
    return id
  }, [removeToast])

  useEffect(() => {
    const msg = sessionStorage.getItem('lumix_flash_message') || ''
    if (!msg) return
    sessionStorage.removeItem('lumix_flash_message')
    const timer = setTimeout(() => {
      pushToast({ message: msg, type: 'warning', durationMs: 6000 })
    }, 0)
    return () => clearTimeout(timer)
  }, [pushToast])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
