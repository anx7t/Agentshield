import { useEffect, useState } from 'react'
import { verifyChain } from '../api/hash.js'
import { TONE_TEXT, statusOf } from './status.js'

const short = (h) => (h ? h.slice(0, 12) : '—')
const time = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

const ACTION = {
  REQUEST: { text: 'Payment requested', tone: null },
  APPROVE: { text: 'Approved by you', tone: 'ok' },
  DENY: { text: 'Denied by you', tone: 'bad' },
}

// Audit trail (GET /api/logs), newest last. The tamper check re-hashes every
// transaction in the browser and points at the first log row whose record fails.
export default function AuditLog({ logs, transactions, agentNames }) {
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    verifyChain(transactions).then((r) => {
      if (!cancelled) setResult(r)
    })
    return () => {
      cancelled = true
    }
  }, [transactions])

  const brokenTxnId = result && !result.valid ? transactions[result.brokenIndex]?.id : null
  const brokenRow = brokenTxnId ? logs.findIndex((l) => l.txnId === brokenTxnId) : -1
  // Show the edited values (the demo "edit" changes the transaction, not the log row).
  const txnById = new Map(transactions.map((t) => [t.id, t]))

  return (
    <div>
      <ChainBanner result={result} rowNumber={brokenRow + 1} />

      <div className="mt-5 max-h-[34rem] overflow-auto border border-line">
        <table className="w-full min-w-[30rem] text-left font-mono text-xs">
          <thead className="sticky top-0 border-b border-line bg-panel-2 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">What happened</th>
              <th className="px-3 py-3">
                <Tip text="A unique code made from this payment. If anything in it changes, this code changes too.">Code</Tip>
              </th>
              <th className="px-3 py-3">
                <Tip text="The code of this agent’s previous payment. Each one is linked to the one before it, so editing any record breaks the links after it.">
                  Linked to
                </Tip>
              </th>
              <th className="px-3 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-neutral-500">
                  Nothing recorded yet. Every payment request, approval and denial shows up here.
                </td>
              </tr>
            )}
            {logs.map((l, i) => {
              const t = txnById.get(l.txnId) ?? l
              const action = ACTION[l.action] ?? { text: l.action, tone: null }
              const tone = action.tone ?? statusOf(t.status).tone
              const agent = l.action === 'REQUEST' ? agentNames.get(l.performedBy) ?? l.performedBy : null
              return (
                <tr
                  key={l.id}
                  className={i === brokenRow ? 'bg-danger/20 outline outline-1 outline-danger' : 'transition-colors hover:bg-white/[0.03]'}
                >
                  <td className="px-3 py-3 align-top text-neutral-600">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className={`font-medium tracking-wide ${TONE_TEXT[tone]}`}>{action.text}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-500">
                      {agent && `${agent} · `}
                      {inr(t.amount)} → {t.payee}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-neutral-300" title={l.hash ?? 'No code for this record'}>{short(l.hash)}</td>
                  <td className="px-3 py-3 align-top text-neutral-500" title={l.prevHash ?? 'First payment for this agent'}>
                    {l.hash ? (l.prevHash ? short(l.prevHash) : 'first') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-400">{time(l.timestamp)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChainBanner({ result, rowNumber }) {
  if (!result || result.checked === 0) return null
  if (result.valid) {
    return (
      <div className="flex items-center gap-4 border border-allowed/40 bg-allowed/[0.06] px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-allowed text-lg font-bold text-black">✓</span>
        <div>
          <div className="text-lg font-semibold tracking-tight text-white">All records are safe</div>
          <div className="mt-0.5 font-mono text-[11px] text-neutral-400">
            We re-checked {result.checked} {result.checked === 1 ? 'payment' : 'payments'} — nothing has been changed.
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex animate-pulse items-center gap-4 border-2 border-danger bg-danger/15 px-5 py-5 shadow-[0_0_50px_rgba(255,68,51,0.35)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-danger text-2xl text-black">⚠</span>
      <div>
        <div className="text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
          Warning: {rowNumber > 0 ? `record #${rowNumber}` : 'a record'} was changed
        </div>
        <div className="mt-1 font-mono text-[11px] text-danger">{result.reason}. Records after it can’t be trusted.</div>
      </div>
    </div>
  )
}

function Tip({ text, children }) {
  return (
    <span className="group relative inline-flex cursor-help items-center gap-1">
      {children}
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-neutral-600 text-[9px] normal-case">?</span>
      <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-64 border border-line bg-panel-2 p-3 font-sans text-xs font-normal normal-case leading-relaxed tracking-normal text-neutral-200 opacity-0 shadow-xl transition group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}
