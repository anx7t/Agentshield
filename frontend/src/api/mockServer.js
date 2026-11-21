// In-browser stand-in for the backend, used when it isn't reachable.'
// Mirrors backend/src routes: same request/response shapes, risk scoring, signing and hash chain.
import { hashTransaction, signTransaction } from './hash.js'
import { seedTransactions } from './mockData.js'

const agents = new Map() // id -> { id, name, email, secret }
const mandates = [] // { id, agent_id, max_amount, allowed_payees, revoked, created_at }
const transactions = [] // backend row shape
const logs = [] // { id, transaction_id, action, performed_by, note, created_at }
let logId = 0

function log(transaction_id, action, performed_by, note = null) {
  logs.push({ id: ++logId, transaction_id, action, performed_by, note, created_at: now() })
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const uid = () => Math.random().toString(16).slice(2, 13)
const NO_MANDATE = { id: null, max_amount: 0, allowed_payees: [], revoked: 1 }
const REQUEST_STATUS = { APPROVED: 'PENDING', DENIED: 'PENDING' }
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19)
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))

// Same rules as backend/src/engine/riskEngine.js
function score(txn, mandate) {
  let riskScore = 0
  if (txn.amount > mandate.max_amount) riskScore += 50
  if (mandate.allowed_payees.length > 0 && !mandate.allowed_payees.includes(txn.payee)) riskScore += 30
  if (mandate.revoked) riskScore += 100
  const status = riskScore === 0 ? 'ALLOWED' : riskScore <= 50 ? 'PENDING' : 'BLOCKED'
  return { score: riskScore, status }
}

export const mock = {
  async registerAgent({ name, email }) {
    await delay()
    if (!name || !email) throw new HttpError(400, 'name and email are required')
    const id = uid()
    const secret = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('')
    agents.set(id, { id, name, email, secret })
    return { agentId: id, secret }
  },

  // GET /api/agents — no secrets.
  async getAgents() {
    await seeded
    await delay(50)
    return {
      agents: [...agents.values()].map(({ id, name, email }) => {
        const mine = mandates.filter((m) => m.agent_id === id)
        const m = mine.filter((x) => !x.revoked).at(-1) ?? mine.at(-1)
        return { id, name, email, mandate: m ? { ...m, revoked: Boolean(m.revoked) } : null }
      }),
    }
  },

  async createMandate({ agent_id, max_amount, allowed_payees }) {
    await delay()
    if (!agent_id || max_amount == null) throw new HttpError(400, 'agent_id and max_amount are required')
    if (!agents.has(agent_id)) throw new HttpError(404, 'Agent not found')
    const id = uid()
    mandates.push({ id, agent_id, max_amount, allowed_payees: allowed_payees || [], revoked: 0, created_at: now() })
    return { mandateId: id }
  },

  async revokeMandate(agentId) {
    await delay()
    let revoked = 0
    for (const m of mandates) {
      if (m.agent_id === agentId && !m.revoked) {
        m.revoked = 1
        revoked++
      }
    }
    return { revoked }
  },

  async requestTransaction({ agent_id, amount, payee, signature }) {
    await delay()
    if (!agent_id) throw new HttpError(400, 'agent_id required')
    const agent = agents.get(agent_id)
    if (!agent) throw new HttpError(404, 'Agent not found')
    if ((await signTransaction(agent.secret, { agentId: agent_id, payee, amount })) !== signature) {
      throw new HttpError(401, 'Invalid signature')
    }
    if (amount == null || !payee) throw new HttpError(400, 'amount and payee are required')

    // Latest mandate, active first; a revoked one still scores (+100 → BLOCKED) and is recorded.
    const mine = mandates.filter((m) => m.agent_id === agent_id)
    const mandate = mine.filter((m) => !m.revoked).at(-1) ?? mine.at(-1) ?? NO_MANDATE

    const { score: riskScore, status } = score({ amount, payee }, mandate)
    const last = transactions.filter((t) => t.agent_id === agent_id && t.hash).at(-1)
    const txn = { id: uid(), agent_id, mandate_id: mandate.id, amount, payee, status, request_status: status, risk_score: riskScore, prev_hash: last?.hash ?? null, created_at: now() }
    txn.hash = await hashTransaction({ id: txn.id, amount, payee, prevHash: txn.prev_hash }, status)
    transactions.push(txn)
    const reason = mandate === NO_MANDATE ? 'no_mandate' : mandate.revoked ? 'mandate_revoked' : null
    log(txn.id, 'REQUEST', agent_id, [`risk_score=${riskScore}`, reason].filter(Boolean).join(' '))
    return { txnId: txn.id, status, riskScore, ...(reason && { reason }) }
  },

  async decide(txnId, status) {
    await delay()
    const txn = transactions.find((t) => t.id === txnId)
    if (!txn) throw new HttpError(404, 'Transaction not found')
    if (!['PENDING', 'ALLOWED'].includes(txn.status)) {
      throw new HttpError(400, `Cannot ${status === 'APPROVED' ? 'approve' : 'deny'} a transaction with status ${txn.status}`)
    }
    txn.status = status
    log(txnId, status === 'APPROVED' ? 'APPROVE' : 'DENY', 'dashboard')
    return { txnId, status }
  },

  async getLogs() {
    await seeded
    await delay(50)
    const byId = new Map(transactions.map((t) => [t.id, t]))
    return {
      logs: logs.map((l) => {
        const t = byId.get(l.transaction_id) ?? {}
        return { ...l, hash: t.hash ?? null, prev_hash: t.prev_hash ?? null, amount: t.amount, payee: t.payee, status: t.status, risk_score: t.risk_score }
      }),
    }
  },

  // Like POST /api/demo/reset: clear payments and history, restore the demo rows.
  async reset() {
    await delay()
    transactions.length = 0
    logs.length = 0
    await seedDemo()
    return { ok: true, message: 'Demo reset', transactions: transactions.length }
  },

  async getTransactions() {
    await seeded
    await delay(50)
    return { transactions: [...transactions].reverse().map((t) => ({ ...t })) }
  },
}

// Demo rows from Aryan"s mockData.js, hash-chained like the backend's seed (agent_001"s chain),
// each with a REQUEST log and APPROVE/DENY where decided.
async function seedDemo() {
  // The demo rows' agent and mandate, as in mockData.js (no secret: it can't sign from the browser).'
  if (!agents.has('agent_001')) {
    agents.set('agent_001', { id: 'agent_001', name: 'Aryan Mehra', email: 'aryan@agentshield.io', secret: null })
    mandates.push({ id: 'mandate_001', agent_id: 'agent_001', max_amount: 5000, allowed_payees: ['payee_alpha', 'payee_beta'], revoked: 0, created_at: '2026-11-20 10:10:00' })
  }
  let prev = null
  for (const t of seedTransactions) {
    const request_status = REQUEST_STATUS[t.status] ?? t.status
    const hash = await hashTransaction({ id: t.id, amount: t.amount, payee: t.payee, prevHash: prev }, request_status)
    transactions.push({ ...t, request_status, hash, prev_hash: prev })
    logs.push({ id: ++logId, transaction_id: t.id, action: 'REQUEST', performed_by: t.agent_id, note: 'demo', created_at: t.created_at })
    if (t.status === 'APPROVED') logs.push({ id: ++logId, transaction_id: t.id, action: 'APPROVE', performed_by: 'demo', note: null, created_at: t.created_at })
    if (t.status === 'DENIED') logs.push({ id: ++logId, transaction_id: t.id, action: 'DENY', performed_by: 'demo', note: null, created_at: t.created_at })
    prev = hash
  }
}
const seeded = seedDemo()
