import { useEffect } from 'react'

const STYLES = {
  success: { cls: 'border-allowed/60', dot: 'bg-allowed' },
  error: { cls: 'border-blocked/70', dot: 'bg-blocked' },
  warn: { cls: 'border-pending/70', dot: 'bg-pending' },
  info: { cls: 'border-line', dot: 'bg-neutral-400' },
}

const LIFETIME_MS = 5000

// Stack of toasts in the top-right corner. Each one closes itself after 5 s;
// toasts with an onClick (e.g. "New approval needed") are clickable.
export default function Notifications({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-[4.5rem] z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const s = STYLES[toast.type] ?? STYLES.info
  const Tag = toast.onClick ? 'button' : 'div'
  return (
    <Tag
      type={toast.onClick ? 'button' : undefined}
      onClick={
        toast.onClick
          ? () => {
              toast.onClick()
              onDismiss(toast.id)
            }
          : undefined
      }
      className={`toast-in pointer-events-auto flex w-full items-start gap-3 border bg-panel/95 px-4 py-3 text-left font-mono text-sm text-white shadow-2xl ${s.cls} ${
        toast.onClick ? 'cursor-pointer transition-colors hover:bg-panel-2' : ''
      }`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 ${s.dot}`} />
      <span className="flex-1">
        {toast.message}
        {toast.onClick && <span className="mt-1 block text-[11px] text-neutral-400">Click to review →</span>}
      </span>
      <span
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss(toast.id)
        }}
        className="pointer-events-auto -mr-1 cursor-pointer px-1 text-neutral-500 hover:text-white"
      >
        ×
      </span>
    </Tag>
  )
}
