import { useState } from 'react'
import { createMandate, revokeMandate } from '../api/client.js'

const MIN = 100
const MAX = 10000
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function MandateForm({ agents, onChange, notify }) {
  const [agentId, setAgentId] = useState('')
  const [amountLimit, setAmountLimit] = useState(5000)
  const [payees, setPayees] = useState([])
  const [payeeInput, setPayeeInput] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null)

  const selected = agents.find((a) => a.id === agentId)
  // For agents added elsewhere (e.g. simulators) we don't know their rules, so Stop is always allowed.
  const hasActiveMandate = Boolean(selected?.mandate?.active || selected?.external)

  // Payees list including whatever is still typed in the box, so nobody has to press Enter.
  function withPending() {
    const name = payeeInput.trim()
    return name && !payees.includes(name) ? [...payees, name] : payees
  }

  function commitPayee() {
    setPayees(withPending())
    setPayeeInput('')
    setErrors((errs) => ({ ...errs, payees: undefined }))
  }

  function handlePayeeKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitPayee()
    } else if (e.key === 'Backspace' && !payeeInput && payees.length) {
      setPayees(payees.slice(0, -1))
    }
  }

  function validate() {
    const errs = {}
    if (!agentId) errs.agentId = 'Please choose an agent.'
    if (withPending().length === 0) errs.payees = 'Add at least one person or company it can pay.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const finalPayees = withPending()
    commitPayee()
    setBusy('create')
    try {
      await createMandate({ agentId, amountLimit, payees: finalPayees })
      notify('success', `Rules saved for ${selected?.name ?? agentId} ✓`)
      onChange()
    } catch (err) {
      notify('error', err.message)
    } finally {
      setBusy(null)
    }
  }

  async function handleRevoke() {
    if (!agentId) {
      setErrors({ agentId: 'Choose an agent first.' })
      return
    }
    setBusy('revoke')
    try {
      await revokeMandate(agentId)
      notify('error', 'Agent stopped ⛔ — it can’t make payments now')
      onChange()
    } catch (err) {
      notify('error', err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field label="AI agent" error={errors.agentId} hint="Which agent these rules are for.">
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="field">
          <option value="">{agents.length ? 'Choose an agent…' : 'Add an agent first…'}</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}{a.external ? ' (from payments)' : a.mandate ? ` — ${a.mandate.active ? 'rules on' : 'stopped'}` : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Most it can pay at once" hint={`Anywhere from ${inr(MIN)} to ${inr(MAX)}.`}>
        <div className="mt-2 flex items-center gap-4">
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={100}
            value={amountLimit}
            onChange={(e) => setAmountLimit(Number(e.target.value))}
            className="w-full accent-[#d4ff3a]"
          />
          <span className="w-28 text-right font-mono text-2xl font-medium tracking-tight text-white">{inr(amountLimit)}</span>
        </div>
      </Field>

      <Field
        label="Who it can pay"
        htmlFor="payee-input"
        error={errors.payees}
        hint="Type a name, then press Enter or click Add. Click × on a name to remove it."
      >
        <div className="field flex flex-wrap items-center gap-2">
          {payees.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPayees(payees.filter((x) => x !== p))}
              className="border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent transition-colors hover:border-danger/60 hover:bg-danger/15 hover:text-danger"
              title={`Remove ${p}`}
            >
              {p} ×
            </button>
          ))}
          <input
            id="payee-input"
            value={payeeInput}
            onChange={(e) => setPayeeInput(e.target.value)}
            onKeyDown={handlePayeeKey}
            onBlur={() => payeeInput.trim() && commitPayee()}
            placeholder={payees.length ? 'Add another…' : 'e.g. Acme Supplies'}
            className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-neutral-600"
          />
          {payeeInput.trim() && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitPayee}
              className="shrink-0 bg-accent px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-black hover:bg-white"
            >
              Add
            </button>
          )}
        </div>
      </Field>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={busy !== null}
          className="btn flex-1"
        >
          {busy === 'create' ? 'Saving…' : 'Save rules'}
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={busy !== null || (agentId !== '' && !hasActiveMandate)}
          className="btn btn-danger"
          title={agentId && !hasActiveMandate ? 'This agent has no rules to stop' : 'Stop this agent from making any payments'}
        >
          {busy === 'revoke' ? 'Stopping…' : 'Stop agent'}
        </button>
      </div>
    </form>
  )
}

// Wraps a control with its label. Pass htmlFor when the field holds buttons:
// a wrapping <label> would forward clicks on it to the first button inside.
function Field({ label, htmlFor, hint, error, children }) {
  const Wrapper = htmlFor ? 'div' : 'label'
  return (
    <Wrapper className="block">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="label text-neutral-400">{label}</label>
      ) : (
        <span className="label text-neutral-400">{label}</span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block font-mono text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block font-mono text-[11px] text-neutral-500">{hint}</span>
      ) : null}
    </Wrapper>
  )
}
