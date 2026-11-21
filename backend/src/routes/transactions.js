const express = require('express');
const { uid } = require('uid');
const { getDb } = require('../db/db_init');
const { score } = require('../engine/riskEngine');
const verifyAgent = require('../middleware/verifyAgent');
const { appendHash, lastHashFor } = require('../utils/hashChain');
const { broadcast } = require('../sse');

const router = express.Router();

// Used when an agent has never had a mandate: nothing is allowed.
const NO_MANDATE = { id: null, max_amount: 0, allowed_payees: '[]', revoked: 1 };

// POST /api/transaction/request
router.post('/transaction/request', verifyAgent, (req, res) => {
  try {
    const { amount, payee } = req.body;
    const agentId = req.agent.id;

    if (amount == null || !payee) {
      return res.status(400).json({ error: 'amount and payee are required' });
    }

    const db = getDb();

    // Latest mandate, active or not: a revoked mandate still scores (+100 → BLOCKED),
    // so the attempt is recorded instead of rejected with an error.
    const mandate =
      db
        .prepare(`SELECT * FROM mandates WHERE agent_id = ? ORDER BY revoked ASC, created_at DESC, rowid DESC LIMIT 1`)
        .get(agentId) || NO_MANDATE;

    const { score: riskScore, status } = score({ amount, payee }, mandate);

    const prevHash = lastHashFor(db, agentId);
    const txnId = uid();
    const txnHash = appendHash({ id: txnId, amount, payee, status }, prevHash);

    db.prepare(`
      INSERT INTO transactions (id, agent_id, mandate_id, amount, payee, status, request_status, risk_score, hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txnId, agentId, mandate.id, amount, payee, status, status, riskScore, txnHash, prevHash);

    const note = mandate === NO_MANDATE ? 'no_mandate' : mandate.revoked ? 'mandate_revoked' : null;
    db.prepare(`
      INSERT INTO logs (transaction_id, action, performed_by, note)
      VALUES (?, 'REQUEST', ?, ?)
    `).run(txnId, agentId, [`risk_score=${riskScore}`, note].filter(Boolean).join(' '));

    broadcast('transaction', { txnId, status, agentId })
    res.status(201).json({ txnId, status, riskScore, ...(note && { reason: note }) });
  } catch (err) {
    res.status(500).json({ error: 'Transaction request failed', detail: err.message });
  }
});

// POST /api/transaction/:id/approve and /deny
// Only `status` changes; `request_status` and `hash` stay as recorded, so the chain still verifies.
function decide(newStatus, action) {
  return (req, res) => {
    try {
      const { id } = req.params;
      const db = getDb();

      const txn = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id);
      if (!txn) return res.status(404).json({ error: 'Transaction not found' });

      if (!['PENDING', 'ALLOWED'].includes(txn.status)) {
        return res.status(400).json({ error: `Cannot ${action.toLowerCase()} a transaction with status ${txn.status}` });
      }

      db.prepare(`UPDATE transactions SET status = ? WHERE id = ?`).run(newStatus, id);
      db.prepare(`INSERT INTO logs (transaction_id, action, performed_by) VALUES (?, ?, ?)`)
        .run(id, action, req.body?.performed_by || 'system');

      broadcast('transaction', { txnId: id, status: newStatus })
      res.json({ txnId: id, status: newStatus });
    } catch (err) {
      res.status(500).json({ error: `${action === 'APPROVE' ? 'Approve' : 'Deny'} failed`, detail: err.message });
    }
  };
}

router.post('/transaction/:id/approve', decide('APPROVED', 'APPROVE'));
router.post('/transaction/:id/deny', decide('DENIED', 'DENY'));

module.exports = router;
