import crypto from 'crypto';

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
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }
  return { httpStatus: res.status, data };
}

function report(label, { httpStatus, data }, expect) {
  const txnStatus = data?.status ?? data?.error ?? 'N/A';
  const riskScore = data?.riskScore ?? 'N/A';
  const pass = expect(httpStatus, data);
  console.log(
    `${label}: HTTP ${httpStatus} | status: ${txnStatus} | riskScore: ${riskScore} | ${pass ? 'PASS' : 'FAIL'}`
  );
}

async function main() {
  console.log('--- Registering RogueBot ---');
  const { data: regData } = await post('/agent/register', { name: 'RogueBot' });
  if (!regData?.agentId) {
    throw new Error('Registration failed, cannot continue');
  }
  const { agentId, secret } = regData;
  console.log(`agentId: ${agentId}`);

  console.log('--- Creating mandate (limit 5000, HDFC_ACC_001 / SBI_ACC_002) ---');
  const allowedPayees = ['HDFC_ACC_001', 'SBI_ACC_002'];
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  await post('/mandate', { agentId, amountLimit: 5000, allowedPayees, expiresAt });

  console.log('--- ATTEMPT 1: over-limit amount (99999) to allowed payee ---');
  {
    const payee = 'HDFC_ACC_001';
    const amount = 99999;
    const signature = sign(agentId, payee, amount, secret);
    const result = await post('/transaction/request', { agentId, payee, amount, signature });
    report('ATTEMPT 1', result, (httpStatus, data) =>
      httpStatus === 200 && (data?.status === 'BLOCKED' || data?.status === 'PENDING')
    );
  }

  console.log('--- ATTEMPT 2: payee not in whitelist (UNKNOWN_ACC) ---');
  {
    const payee = 'UNKNOWN_ACC';
    const amount = 1000;
    const signature = sign(agentId, payee, amount, secret);
    const result = await post('/transaction/request', { agentId, payee, amount, signature });
    report('ATTEMPT 2', result, (httpStatus, data) =>
      httpStatus === 200 && (data?.status === 'BLOCKED' || data?.status === 'PENDING')
    );
  }

  console.log('--- ATTEMPT 3: forged/invalid HMAC signature ---');
  {
    const payee = 'HDFC_ACC_001';
    const amount = 500;
    const forgedSignature = 'deadbeef'.repeat(8); // not derived from secret
    const result = await post('/transaction/request', { agentId, payee, amount, signature: forgedSignature });
    report('ATTEMPT 3', result, (httpStatus) => httpStatus === 401);
  }
}

main().catch((err) => {
  console.error('rogueAgent simulator failed:', err.message);
  process.exit(1);
});
