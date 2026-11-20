import { useEffect, useState } from 'react'
import { requestTransaction } from '../api/client.js'
import { TONE_BADGE, statusOf } from './status.js'

// Demo helper: send a signed payment as an agent and see what AgentShield decides.
export default function TransactionSimulator({ agents, onChange, notify }) {
  const [agentId, setAgentId] = useState('')
  const [amount, setAmount] = useState(2000)
  const [payee, setPayee] = useState('')
  const [last, setLast] = useState(null)
  const [busy, setBusy] = useState(false)

  // Default to the first agent, and prefill a payee from its rules.
  const agent = agents.find((a) => a.id === agentId)
  useEffect(() => {
    if (!agent && agents.length) setAgentId(agents[0].id)
  }, [agent, agents])
  useEffect(() => {
    if (!payee && agent?.mandate?.payees?.length) setPayee(agent.mandate.payees[0])
  }, [agent, payee])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!agentId) return notify('info', 'Add an agent first.')
    if (!payee.trim()) return notify('info', 'Type who the payment is for.')
    setBusy(true)
    try {
      const res = await requestTransaction({ agentId, amount: Number(amount), payee: payee.trim() })
      setLast(res)
      const { text, tone } = statusOf(res.status)
      notify(tone === 'bad' ? 'error' : tone === 'ok' ? 'success' : 'info', `Payment: ${text.toLowerCase()}${res.reason ? ` — ${res.reason}` : ''}`)
      onChange()
    } catch (err) {
      notify('error', err.message)
    } finally {
      setBusy(false)
    }
  }

  const shown = last && statusOf(last.status)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="col-span-2 block">
          <span className="label text-neutral-400">Pay as</span>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="field" disabled={!agents.length}>
            {!agents.length && <option value="">Add an agent first…</option>}
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label text-neutral-400">Amount (₹)</span>
          <input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="label text-neutral-400">Pay to</span>
          <input required value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="e.g. Acme Supplies" className="field" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy || !agents.length} className="btn btn-ghost">
          {busy ? 'Checking…' : 'Try payment'}
        </button>
        {shown && (
          <span className={`border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider ${TONE_BADGE[shown.tone]}`}>
            {shown.text}
            {last.reason && <span className="ml-2 normal-case tracking-normal opacity-80">{last.reason}</span>}
          </span>
        )}
      </div>
      {last?.status === 'PENDING' && (
        <p className="font-mono text-[11px] text-neutral-500">Approve or deny it in Activity history.</p>
      )}
    </form>
  )
}
