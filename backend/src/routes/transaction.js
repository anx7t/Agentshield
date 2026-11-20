// STUB: placeholder route owner unassigned — replace with real implementation
import express from 'express';
import crypto from 'crypto';
import db from '../db/init.js';
import { verifyAgent } from '../middleware/verifyAgent.js';
import { score } from '../engine/riskEngine.js';
import { appendLog } from '../utils/hashChain.js';

const router = express.Router();

router.post('/request', verifyAgent, (req, res) => {
  const { payee, amount } = req.body;
  const agentId = req.agent.id;

  const mandate = db
    .prepare('SELECT * FROM mandates WHERE agent_id = ? ORDER BY expires_at DESC LIMIT 1')
    .get(agentId);

  if (!mandate) {
    return res.status(400).json({ error: 'No mandate found for agent' });
  }

  const txn = { amount, payee };
  const mandateForScoring = {
    amountLimit: mandate.amount_limit,
    allowedPayees: JSON.parse(mandate.allowed_payees),
    revoked: !!mandate.revoked,
  };

  const status = score(txn, mandateForScoring);
  const riskScore =
    (amount > mandate.amount_limit ? 50 : 0) +
    (!mandateForScoring.allowedPayees.includes(payee) ? 30 : 0) +
    (mandate.revoked ? 100 : 0);

  const txnId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO transactions (id, agent_id, payee, amount, risk_score, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(txnId, agentId, payee, amount, riskScore, status, Date.now());

  const lastLog = db.prepare('SELECT hash FROM logs ORDER BY id DESC LIMIT 1').get();
  appendLog(db, 'TRANSACTION_REQUEST', { txnId, agentId, payee, amount, status, riskScore }, lastLog?.hash);

  res.json({ status, riskScore, txnId });
});

router.post('/:id/approve', (req, res) => {
  db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('ALLOWED', req.params.id);
  res.json({ status: 'ALLOWED' });
});

router.post('/:id/deny', (req, res) => {
  db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('BLOCKED', req.params.id);
  res.json({ status: 'BLOCKED' });
});

export default router;
