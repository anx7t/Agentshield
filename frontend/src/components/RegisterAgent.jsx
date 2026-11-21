import { useState } from 'react'
import { registerAgent } from '../api/client.js'

const SUGGESTIONS = ['payrollBot', 'invoiceAgent', 'rogueAgent']

// Registers an AI agent with the backend. Its secret is kept in this browser and used to sign payments.
export default function RegisterAgent({ agents, onChange, notify }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const taken = (n) => agents.some((a) => a.name.toLowerCase() === n.trim().toLowerCase())

  async function add(agentName) {
    const n = agentName.trim()
    if (!n) return setError('Please type a name for the agent.')
    if (taken(n)) return setError(`You already have an agent called ${n}.`)
    setError(null)
    setBusy(true)
    try {
      const agent = await registerAgent(n)
      notify('success', `${agent.name} added ✓`)
      setName('')
      onChange()
    } catch (err) {
      notify('error', err.message)
    } finally {
      setBusy(false)
    }
  }

  const unused = SUGGESTIONS.filter((s) => !taken(s))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        add(name)
      }}
      noValidate
    >
      <label htmlFor="agent-name" className="label text-neutral-400">Agent name</label>
      <div className="mt-2 flex gap-3">
        <input
          id="agent-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. payrollBot"
          className="field mt-0 flex-1"
        />
        <button type="submit" disabled={busy} className="btn shrink-0">
          {busy ? 'Adding…' : 'Add agent'}
        </button>
      </div>
      {error ? (
        <span className="mt-1.5 block font-mono text-xs text-danger">{error}</span>
      ) : (
        <span className="mt-1.5 block font-mono text-[11px] text-neutral-500">
          Each agent gets a private key, saved in this browser, to sign its payments.
        </span>
      )}

      {unused.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-neutral-500">Quick add:</span>
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => add(s)}
              className="border border-line px-2 py-0.5 font-mono text-xs text-neutral-300 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {agents.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {agents.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 font-mono text-xs">
              <span className="min-w-0 truncate text-white">
                {a.name}
                {a.external && <span className="ml-2 text-neutral-600" title="Its secret isn't in this browser, so it can't be used for test payments here">· added elsewhere</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-600" title="Agent ID">{a.id}</span>
                <span className={a.mandate?.active ? 'text-allowed' : a.mandate ? 'text-blocked' : 'text-neutral-500'}>
                  {a.mandate?.active ? 'Rules on' : a.mandate ? 'Stopped' : 'No rules yet'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
