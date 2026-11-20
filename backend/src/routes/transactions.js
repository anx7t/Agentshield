const express = require('express');
const { uid } = require('uid');
const crypto = require('crypto');
const { getDb } = require('../db/db_init');
const { score } = require('../engine/riskEngine');
const verifyAgent = require('../middleware/verifyAgent');

const router = express.Router();

function hashChain(txn, prevHash) {
  const payload = `${prevHash || '0'}:${txn.id}:${txn.amount}:${txn.payee}:${txn.status}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// POST /api/transaction/request
router.post('/transaction/request', verifyAgent, (req, res) => {
  try {
    const { amount, payee } = req.body;
    const agentId = req.agent.id;

    if (amount == null || !payee) {
      return res.status(400).json({ error: 'amount and payee are required' });
    }

    const db = getDb();

    const mandate = db
      .prepare(`SELECT * FROM mandates WHERE agent_id = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 1`)
      .get(agentId);

    if (!mandate) {
      return res.status(400).json({ error: 'No active mandate found for this agent' });
    }

    const { score: riskScore, status } = score({ amount, payee }, mandate);

    const lastTxn = db
      .prepare(`SELECT hash FROM transactions WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(agentId);

    const txnId = uid();
    const txnHash = hashChain({ id: txnId, amount, payee, status }, lastTxn?.hash || null);

    db.prepare(`
      INSERT INTO transactions (id, agent_id, mandate_id, amount, payee, status, risk_score, hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txnId, agentId, mandate.id, amount, payee, status, riskScore, txnHash, lastTxn?.hash || null);

    db.prepare(`
      INSERT INTO logs (transaction_id, action, performed_by, note)
      VALUES (?, 'REQUEST', ?, ?)
    `).run(txnId, agentId, `risk_score=${riskScore}`);

    res.status(201).json({ txnId, status, riskScore });
  } catch (err) {
    res.status(500).json({ error: 'Transaction request failed', detail: err.message });
  }
});

// POST /api/transaction/:id/approve
router.post('/transaction/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const txn = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    if (!['PENDING', 'ALLOWED'].includes(txn.status)) {
      return res.status(400).json({ error: `Cannot approve a transaction with status ${txn.status}` });
    }

    db.prepare(`UPDATE transactions SET status = 'APPROVED' WHERE id = ?`).run(id);
    db.prepare(`INSERT INTO logs (transaction_id, action, performed_by) VALUES (?, 'APPROVE', ?)`)
      .run(id, req.body?.performed_by || 'system');

    res.json({ txnId: id, status: 'APPROVED' });
  } catch (err) {
    res.status(500).json({ error: 'Approve failed', detail: err.message });
  }
});

// POST /api/transaction/:id/deny
router.post('/transaction/:id/deny', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const txn = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    if (!['PENDING', 'ALLOWED'].includes(txn.status)) {
      return res.status(400).json({ error: `Cannot deny a transaction with status ${txn.status}` });
    }

    db.prepare(`UPDATE transactions SET status = 'DENIED' WHERE id = ?`).run(id);
    db.prepare(`INSERT INTO logs (transaction_id, action, performed_by) VALUES (?, 'DENY', ?)`)
      .run(id, req.body?.performed_by || 'system');

    res.json({ txnId: id, status: 'DENIED' });
  } catch (err) {
    res.status(500).json({ error: 'Deny failed', detail: err.message });
  }
});

module.exports = router;
