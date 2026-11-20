const express = require('express');
const { uid } = require('uid');
const crypto = require('crypto');
const { getDb } = require('../db/db_init');

const router = express.Router();

// POST /api/agent/register
router.post('/agent/register', (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const existing = getDb().prepare('SELECT id FROM agents WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Agent with this email already exists' });

    const agentId = uid();
    const secret = crypto.randomBytes(32).toString('hex');

    getDb().prepare('INSERT INTO agents (id, name, email, secret) VALUES (?, ?, ?, ?)').run(agentId, name, email, secret);

    res.status(201).json({ agentId, secret });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register agent', detail: err.message });
  }
});

// POST /api/bank/transfer (mock)
router.post('/bank/transfer', (req, res) => {
  try {
    const { amount, payee } = req.body;
    if (amount == null || !payee) {
      return res.status(400).json({ error: 'amount and payee are required' });
    }
    res.json({ success: true, txRef: uid() });
  } catch (err) {
    res.status(500).json({ error: 'Bank transfer failed', detail: err.message });
  }
});

module.exports = router;
