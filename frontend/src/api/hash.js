// Crypto helpers that must match the backend byte-for-byte:
//   signature: HMAC-SHA256(secret, agentId + payee + String(amount))   — middleware/verifyAgent.js
//   txn hash:  SHA-256(`${prevHash || '0'}:${id}:${amount}:${payee}:${status}`) — routes/transactions.js

const enc = new TextEncoder()
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)))
}

export async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
}

export function signTransaction(secret, { agentId, payee, amount }) {
  return hmacSha256(secret, agentId + payee + String(amount))
}

export function hashTransaction(txn, status = txn.status) {
  return sha256(`${txn.prevHash || '0'}:${txn.id}:${txn.amount}:${txn.payee}:${status}`)
}

// The backend hashes the status at request time; approve/deny change it later.
const ORIGINAL_STATUSES = { APPROVED: ['ALLOWED', 'PENDING'], DENIED: ['ALLOWED', 'PENDING'] }

async function hashMatches(txn) {
  for (const status of [txn.status, ...(ORIGINAL_STATUSES[txn.status] ?? [])]) {
    if ((await hashTransaction(txn, status)) === txn.hash) return true
  }
  return false
}

// Each agent has its own chain. Returns the first broken record (index into txns), if any.
// Records without a hash (e.g. seeded demo rows) aren't part of any chain and are skipped.
export async function verifyChain(txns) {
  const hashesByAgent = new Map()
  for (const t of txns) {
    if (!t.hash) continue
    if (!hashesByAgent.has(t.agentId)) hashesByAgent.set(t.agentId, new Set())
    hashesByAgent.get(t.agentId).add(t.hash)
  }

  const seenFirst = new Set()
  let checked = 0
  for (let i = 0; i < txns.length; i++) {
    const t = txns[i]
    if (!t.hash) continue
    checked++
    if (!(await hashMatches(t))) {
      return { valid: false, brokenIndex: i, checked, reason: 'Someone edited it after it was saved' }
    }
    if (!t.prevHash) {
      if (seenFirst.has(t.agentId)) {
        return { valid: false, brokenIndex: i, checked, reason: 'It isn’t linked to the record before it' }
      }
      seenFirst.add(t.agentId)
    } else if (!hashesByAgent.get(t.agentId).has(t.prevHash)) {
      return { valid: false, brokenIndex: i, checked, reason: 'The record it links to is missing or was changed' }
    }
  }
  return { valid: true, brokenIndex: -1, checked, reason: null }
}
