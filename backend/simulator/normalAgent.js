// Normal agent simulator — fires valid transactions every 2s
// Usage: node simulator/normalAgent.js
// Requires server running on PORT (default 3000)
const crypto = require('crypto');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const INTERVAL_MS = 2000;

const PAYEES = ['payee_alpha', 'payee_beta'];

function sign(agentId, payee, amount, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(agentId + payee + String(amount))
    .digest('hex');
}

async function register() {
  const r = await fetch(`${BASE}/api/agent/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Normal Bot', email: `normal_${Date.now()}@sim.io` }),
  });
  return r.json();
}

async function createMandate(agentId) {
  const r = await fetch(`${BASE}/api/mandate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, max_amount: 5000, allowed_payees: PAYEES }),
  });
  return r.json();
}

async function fireTransaction(agentId, secret) {
  const amount = Math.floor(Math.random() * 4000) + 100; // always under 5000
  const payee = PAYEES[Math.floor(Math.random() * PAYEES.length)];
  const signature = sign(agentId, payee, amount, secret);
  const r = await fetch(`${BASE}/api/transaction/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, amount, payee, signature }),
  });
  const data = await r.json();
  console.log(`[normalAgent] amount=${amount} payee=${payee} → status=${data.status} score=${data.riskScore} txnId=${data.txnId}`);
}

(async () => {
  const { agentId, secret } = await register();
  console.log(`[normalAgent] Registered as ${agentId}`);

  await createMandate(agentId);
  console.log('[normalAgent] Mandate created. Firing transactions every 2s...');

  setInterval(() => fireTransaction(agentId, secret), INTERVAL_MS);
})();
