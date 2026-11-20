// Rogue agent simulator — fires bad transactions to trigger PENDING/BLOCKED
// Usage: node simulator/rogueAgent.js
// Requires server running on PORT (default 3000)
const crypto = require('crypto');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const INTERVAL_MS = 2000;

const ROGUE_PAYEES = ['payee_unknown', 'payee_evil', 'payee_forged'];

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
    body: JSON.stringify({ name: 'Rogue Bot', email: `rogue_${Date.now()}@sim.io` }),
  });
  return r.json();
}

async function createMandate(agentId) {
  const r = await fetch(`${BASE}/api/mandate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, max_amount: 2000, allowed_payees: ['payee_alpha'] }),
  });
  return r.json();
}

async function fireRogueTransaction(agentId, secret, type) {
  let amount, payee, agentOverride;

  if (type === 'over_limit') {
    amount = Math.floor(Math.random() * 5000) + 2001; // always over 2000
    payee = 'payee_alpha';
  } else if (type === 'bad_payee') {
    amount = Math.floor(Math.random() * 1000) + 100;
    payee = ROGUE_PAYEES[Math.floor(Math.random() * ROGUE_PAYEES.length)];
  } else {
    // forged signature — use a random (non-existent) agent_id
    amount = 999;
    payee = 'payee_alpha';
    agentOverride = 'forged_agent_' + Math.random().toString(36).slice(2);
  }

  const effectiveAgentId = agentOverride || agentId;
  // real agent: sign with the real secret but deliberately wrong when impersonating a fake agent
  const signature = agentOverride
    ? 'deadbeef'.repeat(8)
    : sign(effectiveAgentId, payee, amount, secret);

  const body = { agent_id: effectiveAgentId, amount, payee, signature };
  const r = await fetch(`${BASE}/api/transaction/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  const label = `[rogueAgent:${type}]`;
  if (data.status) {
    console.log(`${label} amount=${amount} payee=${payee} → status=${data.status} score=${data.riskScore}`);
  } else {
    console.log(`${label} ✗ rejected: ${data.error}`);
  }
}

const attackTypes = ['over_limit', 'bad_payee', 'forged_signature'];
let tick = 0;

(async () => {
  const { agentId, secret } = await register();
  console.log(`[rogueAgent] Registered as ${agentId}`);

  await createMandate(agentId);
  console.log('[rogueAgent] Mandate created. Firing rogue transactions every 2s...');

  setInterval(() => {
    const type = attackTypes[tick % attackTypes.length];
    tick++;
    fireRogueTransaction(agentId, secret, type);
  }, INTERVAL_MS);
})();
