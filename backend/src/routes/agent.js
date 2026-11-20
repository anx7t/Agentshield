// STUB: placeholder route owner unassigned — replace with real implementation
const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/db_init');
const validateBody = require('../middleware/validateBody');

const router = express.Router();

router.post('/register', validateBody(['name', 'email']), (req, res) => {
  const { name, email } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM agents WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Agent with this email already exists' });
  }

  const agentId = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('hex');

  db.prepare('INSERT INTO agents (id, name, email, secret) VALUES (?, ?, ?, ?)').run(agentId, name, email, secret);

  res.status(201).json({ agentId, secret });
});

module.exports = router;
