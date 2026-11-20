import { useState } from 'react'
import { RiskBar } from './TransactionList.jsx'

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// Payments that need a person to decide. Approve/deny call the backend; the parent re-fetches.
export default function ApprovePanel({ transactions, onDecide }) {
  const [busy, setBusy] = useState(null)
  const pending = transactions.filter((t) => t.status === 'PENDING').reverse()

  async function decide(id, approve) {
    setBusy(id)
    try {
      await onDecide(id, approve)
    } finally {
      setBusy(null)
    }
  }

  if (pending.length === 0) {
    return (
      <p className="border border-dashed border-line px-4 py-6 text-center font-mono text-xs text-neutral-500">
        No pending approvals
      </p>
    )
  }

  return (
    <ul className="divide-y divide-line border border-pending/40 bg-pending/[0.04]">
      {pending.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
          <div className="min-w-0 font-mono text-xs">
            <div className="truncate text-white">
              <span className="text-lg font-medium tracking-tight">{inr(t.amount)}</span>
              <span className="text-neutral-400"> → {t.payee}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-neutral-500">
              <span className="truncate" title={t.agentId}>by {t.agentName ?? t.agentId}</span>
              <RiskBar score={t.riskScore ?? 0} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy === t.id}
              onClick={() => decide(t.id, true)}
              className="btn btn-allowed btn-sm"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy === t.id}
              onClick={() => decide(t.id, false)}
              className="btn btn-danger btn-sm"
            >
              Deny
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
