import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import Notifications from '../components/Notifications.jsx'
import MandateForm from '../components/MandateForm.jsx'
import AuditLog from '../components/AuditLog.jsx'
import TransactionSimulator from '../components/TransactionSimulator.jsx'
import TransactionList from '../components/TransactionList.jsx'
import ApprovePanel from '../components/ApprovePanel.jsx'
import RegisterAgent from '../components/RegisterAgent.jsx'
import {
  approveTransaction,
  denyTransaction,
  getAgents,
  getLogs,
  getTransactions,
  isMock,
  onModeChange,
  openEvents,
  resetDemo,
} from '../api/client.js'
import { currentUser, logout } from '../api/auth.js'

const POLL_MS = 3000
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function Dashboard() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [txns, setTxns] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const [mock, setMock] = useState(isMock())
  const [live, setLive] = useState(false)
  const [resetting, setResetting] = useState(false)
  // Demo only: corrupt one record in the displayed copy to show tamper detection.
  const [tamperedId, setTamperedId] = useState(null)
  const knownPending = useRef(null)
  const approvalsRef = useRef(null)

  const dismiss = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])
  const notify = useCallback((type, message, onClick) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((ts) => [...ts.slice(-3), { id, type, message, onClick }])
  }, [])

  const scrollToApprovals = useCallback(() => {
    approvalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([getTransactions(), getLogs()])
      // Read agents after the requests: the first call may switch to demo data.
      setAgents(await getAgents())
      setTxns(t)
      setLogs(l)
      setLoading(false)

      // Alert on payments that started waiting since the last poll (not on first load).
      const pendingNow = t.filter((x) => x.status === 'PENDING')
      if (knownPending.current) {
        for (const x of pendingNow) {
          if (!knownPending.current.has(x.id)) notify('warn', `🔔 New approval needed: ${x.payee} ${inr(x.amount)}`, scrollToApprovals)
        }
      }
      knownPending.current = new Set(pendingNow.map((x) => x.id))
    } catch (err) {
      console.error('Refresh failed', err)
    }
  }, [notify, scrollToApprovals])

  useEffect(() => onModeChange(setMock), [])

  // SSE for real-time pushes; polling stays as a fallback for missed events
  useEffect(() => {
    const es = openEvents(refresh)
    if (!es) return
    const onOpen = () => setLive(true)
    const onError = () => setLive(false)
    es.addEventListener('open', onOpen)
    es.addEventListener('error', onError)
    return () => {
      es.removeEventListener('open', onOpen)
      es.removeEventListener('error', onError)
      es.close()
      setLive(false)
    }
  }, [mock, refresh])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  // Names come from GET /api/agents, so simulator and other-browser agents show by name too.
  const agentNames = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents])
  const namedTxns = useMemo(
    () => txns.map((t) => ({ ...t, agentName: agentNames.get(t.agentId) ?? t.agentName })),
    [txns, agentNames],
  )

  const shownTxns = useMemo(() => {
    if (tamperedId == null) return namedTxns
    return namedTxns.map((t) => (t.id === tamperedId ? { ...t, amount: 99999, payee: 'Attacker Ltd' } : t))
  }, [namedTxns, tamperedId])

  function toggleTamper() {
    if (tamperedId != null) return setTamperedId(null)
    const coded = txns.filter((t) => t.hash)
    if (coded.length === 0) return notify('info', 'Nothing to edit yet — try a payment first.')
    // Pick a record in the middle so the break is visible mid-chain.
    setTamperedId(coded[Math.floor((coded.length - 1) / 2)].id)
  }

  const decide = useCallback(
    async (id, approve) => {
      try {
        await (approve ? approveTransaction(id) : denyTransaction(id))
        notify(approve ? 'success' : 'error', approve ? 'Payment approved ✓' : 'Payment denied')
        refresh()
      } catch (err) {
        notify('error', err.message)
      }
    },
    [notify, refresh],
  )

  async function handleReset() {
    if (!window.confirm('Clear all payments and history for a fresh demo run? Agents and rules are kept.')) return
    setResetting(true)
    try {
      await resetDemo()
      setTamperedId(null)
      knownPending.current = null
      notify('success', 'Demo reset ✓ — ready for a fresh run')
      await refresh()
    } catch (err) {
      notify('error', err.message)
    } finally {
      setResetting(false)
    }
  }

  // Only agents whose secret is in this browser can sign test payments.
  const signingAgents = useMemo(() => agents.filter((a) => !a.external), [agents])
  // Agents added here plus any others (e.g. the simulators) that have made payments.
  const agentCount = new Set([...agents.map((a) => a.id), ...txns.map((t) => t.agentId)]).size
  // Rules can be set or stopped for any agent (no secret needed), including the simulators'.'
  // Agents seen only in payments (e.g. an older backend without GET /agents) are added too.
  const ruleAgents = useMemo(() => {
    const known = new Set(agents.map((a) => a.id))
    const others = [...new Set(txns.map((t) => t.agentId))]
      .filter((id) => !known.has(id))
      .map((id) => ({ id, name: `Agent ${id}`, external: true, mandate: null }))
    return [...agents, ...others]
  }, [agents, txns])
  const waitingCount = txns.filter((t) => t.status === 'PENDING').length
  const blockedCount = txns.filter((t) => t.status === 'BLOCKED' || t.status === 'DENIED').length

  return (
    <div className="min-h-svh overflow-x-clip bg-ink">
      <div className="border-b border-line">
        <SiteHeader
          links={[
            { href: '/', label: 'Home' },
            { href: '#controls', label: 'Controls' },
          ]}
          action={
            <div className="flex items-center gap-4 sm:gap-6">
              <span
                className={`hidden items-center gap-2 font-mono text-[12px] sm:inline-flex ${mock ? 'text-neutral-400' : 'text-allowed'}`}
                title={
                  mock
                    ? "Using built-in example data because the server isn't running"
                    : live
                    ? 'Payments stream in without page refresh'
                    : 'Connected to the server'
                }
              >
                <span className={`h-1.5 w-1.5 ${mock ? 'bg-neutral-400' : live ? 'blink bg-allowed' : 'bg-allowed'}`} />
                {mock ? 'Demo data' : live ? 'Live' : 'Connected'}
              </span>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="font-mono text-[13px] text-neutral-400 transition-colors hover:text-white disabled:opacity-40"
                title="Clear all payments and history for a clean demo run"
              >
                {resetting ? 'Resetting…' : 'Reset demo'}
              </button>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="font-mono text-[13px] text-white transition-colors hover:text-accent"
                title={currentUser() ?? undefined}
              >
                Sign out
              </button>
            </div>
          }
        />
      </div>

      <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        {/* Title + live stats */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="label text-accent">Dashboard</p>
            <h1 className="display mt-3 text-[clamp(2.5rem,5vw,4.75rem)]">
              Your <span className="scan">AI agents</span>
            </h1>
          </div>
          <dl className="grid grid-cols-2 gap-y-5 border-l border-line sm:grid-cols-4">
            <Stat label="Payments" value={txns.length} loading={loading} />
            <Stat label="Waiting" value={waitingCount} tone={waitingCount ? 'warn' : undefined} loading={loading} />
            <Stat label="Stopped" value={blockedCount} tone={blockedCount ? 'bad' : undefined} loading={loading} />
            <Stat label="Agents" value={agentCount} loading={loading} />
          </dl>
        </div>

        {/* Live view: approvals + payments on the left, audit trail on the right */}
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2 xl:gap-8">
          <div className="space-y-6 xl:space-y-8">
            <section ref={approvalsRef} id="approvals" className="scroll-mt-6">
              <Panel
                index="01"
                title="Needs your approval"
                subtitle="Payments that broke a rule but weren't risky enough to stop outright"
                badge={waitingCount ? `${waitingCount} waiting` : null}
              >
                <ApprovePanel transactions={namedTxns} onDecide={decide} />
              </Panel>
            </section>
            <Panel index="02" title="Payments" subtitle={`Newest first · updates every ${POLL_MS / 1000}s`}>
              <TransactionList transactions={shownTxns} loading={loading} />
            </Panel>
          </div>

          <Panel
            index="03"
            title="Activity history"
            subtitle="Every request, approval and denial — in a record that can't be secretly changed"
            action={
              <button
                onClick={toggleTamper}
                className={`btn btn-sm shrink-0 ${tamperedId != null ? 'btn-ghost' : 'btn-danger'}`}
                title="Pretend someone secretly edits a record, to see how it gets caught"
              >
                {tamperedId != null ? 'Undo edit' : 'Try editing a record'}
              </button>
            }
          >
            <AuditLog logs={logs} transactions={shownTxns} agentNames={agentNames} />
          </Panel>
        </div>

        {/* Controls */}
        <div id="controls" className="scroll-mt-6 pt-16">
          <p className="label text-accent">Controls</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Set up agents and try payments</h2>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3 xl:gap-8">
            <Panel index="04" title="Add an AI agent" subtitle="Register the agents you want to keep an eye on">
              <RegisterAgent agents={agents} onChange={refresh} notify={notify} />
            </Panel>
            <Panel index="05" title="Set spending rules" subtitle="Choose what an agent is allowed to pay">
              <MandateForm agents={ruleAgents} onChange={refresh} notify={notify} />
            </Panel>
            <Panel index="06" title="Test a payment" subtitle="Pretend to be an agent and see if the payment goes through">
              <TransactionSimulator agents={signingAgents} onChange={refresh} notify={notify} />
            </Panel>
          </div>
        </div>
      </main>

      <Notifications toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function Panel({ index, title, subtitle, action, badge, children }) {
  return (
    <section className="h-full border border-line bg-panel">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-line px-5 py-4 sm:flex-row sm:gap-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[11px] text-neutral-500">{index}</span>
            <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
            {badge && <span className="border border-pending/50 bg-pending/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-pending">{badge}</span>}
          </div>
          {subtitle && <p className="mt-1 font-mono text-[11px] text-neutral-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

const STAT_TONE = { warn: 'text-pending', bad: 'text-blocked' }

function Stat({ label, value, tone, loading }) {
  return (
    <div className="min-w-0 border-r border-line px-3 sm:px-6">
      <dt className="label truncate text-[10px] text-neutral-500">{label}</dt>
      <dd className={`mt-2 font-mono text-3xl font-medium tracking-tight sm:text-5xl ${STAT_TONE[tone] ?? 'text-white'}`}>
        {loading ? <span className="skeleton inline-block h-9 w-12 align-middle sm:h-11" /> : String(value).padStart(2, '0')}
      </dd>
    </div>
  )
}
