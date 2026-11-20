// API client for the AgentShield backend (backend/src/routes).
// Talks to the real backend; if it's unreachable, falls back to an in-browser copy
// (mockServer.js) so the demo never dead-ends.
//
// Base URL: /api, proxied to http://localhost:3000 in dev (vite.config.js).
// Set VITE_API_URL (e.g. https://your-backend.up.railway.app/api) to call a deployed backend directly.
// Force a mode with VITE_API_MODE=real | mock (default: auto).
import { mock } from './mockServer.js'
import { signTransaction } from './hash.js'
import { addAgent, findAgent, loadAgents, updateAgent } from './agentStore.js'

const BASE = import.meta.env.VITE_API_URL || '/api'
const MODE = import.meta.env.VITE_API_MODE || 'auto'
let usingMock = MODE === 'mock'
const listeners = new Set()

export function isMock() {
  return usingMock
}

export function onModeChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const mode = () => (usingMock ? 'mock' : 'real')

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    // No JSON body usually means there's no backend behind the proxy.
    if (data === null) throw new TypeError(`Backend unavailable (${res.status})`)
    throw new ApiError(res.status, data.error || data.message || `Request failed (${res.status})`)
  }
  return data
}

async function call(realFn, mockFn) {
  if (usingMock) return wrapMock(mockFn)
  try {
    return await realFn()
  } catch (err) {
    if (MODE === 'auto' && err instanceof TypeError) {
      console.warn('[AgentShield] Backend unreachable, switching to demo data:', err.message)
      usingMock = true
      listeners.forEach((fn) => fn(true))
      return wrapMock(mockFn)
    }
    throw err
  }
}

async function wrapMock(fn) {
  try {
    return await fn()
  } catch (err) {
    throw err.status ? new ApiError(err.status, err.message) : err
  }
}

// ── Agents ─────────────────────────────────────────────────

export async function getAgents() {
  return loadAgents(mode())
}

export async function registerAgent(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'agent'
  const body = { name: name.trim(), email: `${slug}_${Date.now()}@agentshield.io` }
  const { agentId, secret } = await call(() => request('POST', '/agent/register', body), () => mock.registerAgent(body))
  const agent = { id: agentId, name: body.name, secret, mandate: null, createdAt: new Date().toISOString() }
  addAgent(mode(), agent)
  return agent
}

// ── Mandates (spending rules) ──────────────────────────────

export async function createMandate({ agentId, amountLimit, payees }) {
  const body = { agent_id: agentId, max_amount: amountLimit, allowed_payees: payees }
  const res = await call(() => request('POST', '/mandate', body), () => mock.createMandate(body))
  updateAgent(mode(), agentId, { mandate: { id: res.mandateId, maxAmount: amountLimit, payees, active: true } })
  return res
}

export async function revokeMandate(agentId) {
  const res = await call(
    () => request('DELETE', `/mandate/${encodeURIComponent(agentId)}`),
    () => mock.revokeMandate(agentId),
  )
  const agent = findAgent(mode(), agentId)
  if (agent?.mandate) updateAgent(mode(), agentId, { mandate: { ...agent.mandate, active: false } })
  return res
}

// ── Transactions ───────────────────────────────────────────

// Why a payment needed checking, in plain words, based on the agent's current rules.
function explain(agent, { amount, payee }) {
  const m = agent?.mandate
  if (!m?.active) return 'This agent has no active spending rules'
  const reasons = []
  if (amount > m.maxAmount) reasons.push(`Over the ₹${m.maxAmount.toLocaleString('en-IN')} limit`)
  if (m.payees.length && !m.payees.includes(payee)) reasons.push(`"${payee}" isn’t on the allowed list`)
  return reasons.join(' and ') || null
}

// Returns { txnId, status, riskScore, reason }. status: ALLOWED | PENDING | BLOCKED.
export async function requestTransaction({ agentId, amount, payee }) {
  const agent = findAgent(mode(), agentId)
  if (!agent) throw new ApiError(404, 'This agent isn’t registered in this browser. Add it again.')
  const signature = await signTransaction(agent.secret, { agentId, payee, amount })
  const body = { agent_id: agentId, amount, payee, signature }
  try {
    const res = await call(() => request('POST', '/transaction/request', body), () => mock.requestTransaction(body))
    return { ...res, reason: res.status === 'ALLOWED' ? null : explain(agent, { amount, payee }) }
  } catch (err) {
    // A revoked agent has no mandate: the backend refuses the payment outright.
    if (err instanceof ApiError && err.status === 400 && /no active mandate/i.test(err.message)) {
      return { txnId: null, status: 'BLOCKED', riskScore: null, reason: explain({ mandate: null }, body) }
    }
    if (err instanceof ApiError && err.status === 401) throw new ApiError(401, 'The payment signature was rejected')
    throw err
  }
}

export const approveTransaction = (txnId) =>
  call(() => request('POST', `/transaction/${encodeURIComponent(txnId)}/approve`, { performed_by: 'dashboard' }), () => mock.decide(txnId, 'APPROVED'))

export const denyTransaction = (txnId) =>
  call(() => request('POST', `/transaction/${encodeURIComponent(txnId)}/deny`, { performed_by: 'dashboard' }), () => mock.decide(txnId, 'DENIED'))

// SQLite's datetime('now') is UTC without a zone marker.
const parseTime = (s) => (s && !/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? new Date(s.replace(' ', 'T') + 'Z') : new Date(s))

// All transactions, oldest first, in the shape the UI uses.
export async function getTransactions() {
  const { transactions } = await call(() => request('GET', '/transactions'), () => mock.getTransactions())
  const names = new Map(loadAgents(mode()).map((a) => [a.id, a.name]))
  return transactions
    .slice()
    .reverse() // API is newest first; reversing keeps same-second rows in insert order
    .map((t) => ({
      id: t.id,
      agentId: t.agent_id,
      agentName: names.get(t.agent_id) ?? null,
      amount: t.amount,
      payee: t.payee,
      status: t.status,
      riskScore: t.risk_score,
      hash: t.hash,
      prevHash: t.prev_hash,
      timestamp: parseTime(t.created_at),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}

// Audit trail: one row per REQUEST / APPROVE / DENY, oldest first, joined with its transaction.
export async function getLogs() {
  const { logs } = await call(() => request('GET', '/logs'), () => mock.getLogs())
  return logs.map((l) => ({
    id: l.id,
    txnId: l.transaction_id,
    action: l.action,
    performedBy: l.performed_by,
    note: l.note,
    timestamp: parseTime(l.created_at),
    hash: l.hash,
    prevHash: l.prev_hash,
    amount: l.amount,
    payee: l.payee,
    status: l.status,
    riskScore: l.risk_score,
  }))
}

// POST /api/demo/reset — clears payments and history for a clean demo run.
export async function resetDemo() {
  return call(() => request('POST', '/demo/reset'), () => mock.reset())
}
