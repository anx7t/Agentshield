const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001/api';

function sign(agentId, payee, amount, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(agentId + payee + String(amount))
    .digest('hex');
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`POST ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('--- Registering NormalBot ---');
  const { agentId, secret } = await post('/agent/register', {
    name: 'NormalBot',
    email: `normal_${Date.now()}@sim.io`,
  });
  console.log(`agentId: ${agentId}`);

  console.log('--- Creating mandate ---');
  const allowedPayees = ['HDFC_ACC_001', 'SBI_ACC_002'];
  const { mandateId } = await post('/mandate', {
    agent_id: agentId,
    max_amount: 5000,
    allowed_payees: allowedPayees,
  });
  console.log(`mandateId: ${mandateId}`);

  const transactions = [
    { payee: 'HDFC_ACC_001', amount: 100 },
    { payee: 'SBI_ACC_002', amount: 2500 },
    { payee: 'HDFC_ACC_001', amount: 4999 },
  ];

  for (const [i, txn] of transactions.entries()) {
    console.log(`--- Transaction ${i + 1}: ${txn.payee}, amount ${txn.amount} ---`);
    const signature = sign(agentId, txn.payee, txn.amount, secret);
    try {
      const result = await post('/transaction/request', {
        agent_id: agentId,
        payee: txn.payee,
        amount: txn.amount,
        signature,
      });
      console.log(`status: ${result.status}, riskScore: ${result.riskScore}, txnId: ${result.txnId}`);
    } catch (err) {
      console.error(`Transaction ${i + 1} errored: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('normalAgent simulator failed:', err.message);
  process.exit(1);
});
