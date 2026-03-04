export function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-xl shadow-black/30 ${getToastStyles(
            toast.type,
          )}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md px-1 text-xs text-slate-300 transition hover:bg-slate-800/60"
              aria-label="Закрыть уведомление"
            >
              ✕
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function getToastStyles(type) {
  if (type === 'error') return 'border-rose-400/40 bg-rose-900/60 text-rose-100'
  if (type === 'success') return 'border-emerald-400/40 bg-emerald-900/60 text-emerald-100'
  return 'border-slate-500/50 bg-slate-900/85 text-slate-100'
}
