// STUB: placeholder route owner unassigned — replace with real implementation
import express from 'express';
import crypto from 'crypto';
import db from '../db/init.js';

const router = express.Router();

router.post('/register', (req, res) => {
  const { name } = req.body;
  const agentId = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('hex');

  db.prepare(
    'INSERT INTO agents (id, name, secret, created_at) VALUES (?, ?, ?, ?)'
  ).run(agentId, name, secret, Date.now());

  res.json({ agentId, secret });
});

export default router;
