// STUB: placeholder route owner unassigned — replace with real implementation
import express from 'express';
import crypto from 'crypto';
import db from '../db/init.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { agentId, amountLimit, allowedPayees, expiresAt } = req.body;
  const mandateId = crypto.randomUUID();

  db.prepare(
    'INSERT INTO mandates (id, agent_id, amount_limit, allowed_payees, expires_at, revoked) VALUES (?, ?, ?, ?, ?, 0)'
  ).run(mandateId, agentId, amountLimit, JSON.stringify(allowedPayees), expiresAt);

  res.json({ mandateId });
});

router.delete('/:agentId', (req, res) => {
  db.prepare('UPDATE mandates SET revoked = 1 WHERE agent_id = ?').run(req.params.agentId);
  res.json({ revoked: true });
});

export default router;
