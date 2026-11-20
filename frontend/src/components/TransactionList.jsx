import { useEffect, useRef } from 'react'
import { TONE_BADGE, TONE_BG, TONE_TEXT, riskTone, statusOf } from './status.js'

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const time = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

// All payments, newest first. Rows that arrive after the first load slide in.
export default function TransactionList({ transactions, loading }) {
  const seen = useRef(null)

  // Ids present on the previous render; anything not in it is new.
  const isNew = (id) => seen.current !== null && !seen.current.has(id)
  useEffect(() => {
    if (!loading) seen.current = new Set(transactions.map((t) => t.id))
  }, [transactions, loading])

  const rows = [...transactions].reverse()

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[32rem] text-left font-mono text-xs">
        <thead className="border-b border-line bg-panel-2 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
          <tr>
            <th className="px-3 py-3">Agent</th>
            <th className="px-3 py-3">Pay to</th>
            <th className="px-3 py-3 text-right">Amount</th>
            <th className="px-3 py-3">Risk</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading &&
            Array.from({ length: 5 }, (_, i) => (
              <tr key={i}>
                {[16, 20, 12, 18, 22, 14].map((w, j) => (
                  <td key={j} className="px-3 py-3.5">
                    <span className="skeleton block h-3" style={{ width: `${w * 4}px` }} />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">
                No payments yet. Add an agent, set its rules, then try a payment.
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((t) => {
              const s = statusOf(t.status)
              return (
                <tr key={t.id} className={isNew(t.id) ? 'row-new' : 'transition-colors hover:bg-white/[0.03]'}>
                  <td className="max-w-[8rem] truncate px-3 py-3 text-white" title={t.agentId}>
                    {t.agentName ?? t.agentId}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-3 text-neutral-300">{t.payee}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-white">{inr(t.amount)}</td>
                  <td className="px-3 py-3">
                    <RiskBar score={t.riskScore ?? 0} />
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block whitespace-nowrap border px-2 py-0.5 text-[10px] uppercase tracking-wider ${TONE_BADGE[s.tone]}`}>
                      {s.short}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-neutral-500">{time(t.timestamp)}</td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

export function RiskBar({ score }) {
  const tone = riskTone(score)
  return (
    <span className="flex items-center gap-2" title={`Risk score ${score} (0–29 low, 30–69 medium, 70+ high)`}>
      <span className={`w-7 text-right tabular-nums ${TONE_TEXT[tone]}`}>{score}</span>
      <span className="h-1.5 w-10 bg-white/10">
        <span className={`block h-full ${TONE_BG[tone]}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </span>
    </span>
  )
}
