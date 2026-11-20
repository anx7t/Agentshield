// STUB: placeholder route owner unassigned — replace with real implementation
const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/db_init');
const validateBody = require('../middleware/validateBody');

const router = express.Router();

router.post('/', validateBody(['agent_id', 'max_amount']), (req, res) => {
  const { agent_id, max_amount, allowed_payees } = req.body;
  const db = getDb();

  const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(agent_id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const mandateId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO mandates (id, agent_id, max_amount, allowed_payees) VALUES (?, ?, ?, ?)'
  ).run(mandateId, agent_id, max_amount, JSON.stringify(allowed_payees || []));

  res.json({ mandateId });
});

router.delete('/:agentId', (req, res) => {
  getDb().prepare('UPDATE mandates SET revoked = 1 WHERE agent_id = ?').run(req.params.agentId);
  res.json({ revoked: true });
});

module.exports = router;
