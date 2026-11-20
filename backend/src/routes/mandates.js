const express = require('express');
const { uid } = require('uid');
const { getDb } = require('../db/db_init');

const router = express.Router();

// POST /api/mandate — create a mandate
router.post('/mandate', (req, res) => {
  try {
    const { agent_id, max_amount, allowed_payees } = req.body;

    if (!agent_id || max_amount == null) {
      return res.status(400).json({ error: 'agent_id and max_amount are required' });
    }

    const agent = getDb().prepare('SELECT id FROM agents WHERE id = ?').get(agent_id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const mandateId = uid();
    getDb().prepare(`
      INSERT INTO mandates (id, agent_id, max_amount, allowed_payees)
      VALUES (?, ?, ?, ?)
    `).run(mandateId, agent_id, max_amount, JSON.stringify(allowed_payees || []));

    res.status(201).json({ mandateId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create mandate', detail: err.message });
  }
});

// DELETE /api/mandate/:agentId — revoke all mandates for an agent
router.delete('/mandate/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const result = getDb()
      .prepare(`UPDATE mandates SET revoked = 1 WHERE agent_id = ? AND revoked = 0`)
      .run(agentId);
    res.json({ revoked: result.changes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke mandates', detail: err.message });
  }
});

// GET /api/transactions — list all transactions newest first
router.get('/transactions', (req, res) => {
  try {
    const transactions = getDb()
      .prepare(`SELECT * FROM transactions ORDER BY created_at DESC`)
      .all();
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', detail: err.message });
  }
});

module.exports = router;
