const crypto = require('crypto');

// Hash of one transaction, chained to the agent's previous one.
// `status` must be the status decided at request time (stored as request_status):
// approve/deny change transactions.status later, which must not break the chain.
function appendHash(txnData, prevHash) {
  const payload = `${prevHash || '0'}:${txnData.id}:${txnData.amount}:${txnData.payee}:${txnData.status}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// The agent's latest transaction. rowid breaks ties: created_at only has second resolution.
function lastHashFor(db, agentId) {
  return db
    .prepare('SELECT hash FROM transactions WHERE agent_id = ? AND hash IS NOT NULL ORDER BY created_at DESC, rowid DESC LIMIT 1')
    .get(agentId)?.hash || null;
}

module.exports = { appendHash, lastHashFor };
