const { uid } = require('uid');
const { appendHash, lastHashFor } = require('../utils/hashChain');

// Final status → the status the risk engine gave at request time (approve/deny happen later).
const REQUEST_STATUS = { APPROVED: 'PENDING', DENIED: 'PENDING' };

const STATUSES = ['ALLOWED', 'ALLOWED', 'ALLOWED', 'PENDING', 'PENDING', 'BLOCKED', 'ALLOWED', 'APPROVED', 'DENIED', 'BLOCKED'];

// Inserts 10 demo transactions for one agent, hash-chained like real requests,
// each with a REQUEST log (plus APPROVE/DENY for decided ones), so the dashboard's
// tamper check and activity history cover them too.
function seedTransactions(db, agentId, mandateId) {
  let prevHash = lastHashFor(db, agentId);

  const insertTxn = db.prepare(`
    INSERT INTO transactions (id, agent_id, mandate_id, amount, payee, status, request_status, risk_score, hash, prev_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLog = db.prepare(`INSERT INTO logs (transaction_id, action, performed_by, note) VALUES (?, ?, ?, ?)`);

  STATUSES.forEach((status, i) => {
    const id = uid();
    const requestStatus = REQUEST_STATUS[status] || status;
    const amount = Math.floor(Math.random() * 8000) + 500;
    const payee = i % 3 === 0 ? 'payee_alpha' : i % 3 === 1 ? 'payee_beta' : 'payee_unknown';
    const riskScore = requestStatus === 'ALLOWED' ? 0 : requestStatus === 'PENDING' ? 30 : 80;
    const hash = appendHash({ id, amount, payee, status: requestStatus }, prevHash);

    insertTxn.run(id, agentId, mandateId, amount, payee, status, requestStatus, riskScore, hash, prevHash);
    insertLog.run(id, 'REQUEST', agentId, `risk_score=${riskScore} demo`);
    if (status === 'APPROVED') insertLog.run(id, 'APPROVE', 'demo', null);
    if (status === 'DENIED') insertLog.run(id, 'DENY', 'demo', null);

    prevHash = hash;
  });

  return STATUSES.length;
}

module.exports = { seedTransactions };
