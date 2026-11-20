// STUB: placeholder route owner unassigned — replace with real implementation
const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/db_init');
const verifyAgent = require('../middleware/verifyAgent');
const validateBody = require('../middleware/validateBody');
const { score } = require('../engine/riskEngine');
const { appendHash } = require('../utils/hashChain');

const router = express.Router();

router.post('/request', verifyAgent, validateBody(['amount', 'payee']), (req, res) => {
  const { payee, amount } = req.body;
  const agentId = req.agent.id;
  const db = getDb();

  const mandate = db
    .prepare('SELECT * FROM mandates WHERE agent_id = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 1')
    .get(agentId);

  if (!mandate) {
    return res.status(400).json({ error: 'No mandate found for agent' });
  }

  const { score: riskScore, status } = score({ amount, payee }, mandate);

  const lastTxn = db
    .prepare('SELECT hash FROM transactions WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(agentId);
  const prevHash = lastTxn?.hash || null;

  const txnId = crypto.randomUUID();
  const hash = appendHash({ id: txnId, amount, payee, status }, prevHash);

  db.prepare(
    'INSERT INTO transactions (id, agent_id, mandate_id, amount, payee, status, risk_score, hash, prev_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(txnId, agentId, mandate.id, amount, payee, status, riskScore, hash, prevHash);

  db.prepare(
    `INSERT INTO logs (transaction_id, action, performed_by, note) VALUES (?, 'REQUEST', ?, ?)`
  ).run(txnId, agentId, `risk_score=${riskScore}`);

  res.json({ status, riskScore, txnId });
});

router.post('/:id/approve', (req, res) => {
  const db = getDb();
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (!['PENDING', 'ALLOWED'].includes(txn.status)) {
    return res.status(400).json({ error: `Cannot approve a transaction with status ${txn.status}` });
  }

  db.prepare(`UPDATE transactions SET status = 'APPROVED' WHERE id = ?`).run(req.params.id);
  db.prepare(`INSERT INTO logs (transaction_id, action, performed_by) VALUES (?, 'APPROVE', ?)`)
    .run(req.params.id, req.body?.performed_by || 'system');

  res.json({ txnId: req.params.id, status: 'APPROVED' });
});

router.post('/:id/deny', (req, res) => {
  const db = getDb();
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (!['PENDING', 'ALLOWED'].includes(txn.status)) {
    return res.status(400).json({ error: `Cannot deny a transaction with status ${txn.status}` });
  }

  db.prepare(`UPDATE transactions SET status = 'DENIED' WHERE id = ?`).run(req.params.id);
  db.prepare(`INSERT INTO logs (transaction_id, action, performed_by) VALUES (?, 'DENY', ?)`)
    .run(req.params.id, req.body?.performed_by || 'system');

  res.json({ txnId: req.params.id, status: 'DENIED' });
});

module.exports = router;
