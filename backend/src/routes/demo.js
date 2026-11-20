const express = require('express');
const { uid } = require('uid');
const { getDb } = require('../db/db_init');

const router = express.Router();

// POST /api/demo/reset — truncate transactions + logs, re-seed demo data
// Keeps agents and mandates intact so demo flow doesn't need to re-register
router.post('/demo/reset', (req, res) => {
  try {
    const db = getDb();

    db.exec(`
      DELETE FROM logs;
      DELETE FROM transactions;
    `);

    // Re-seed 10 transactions against the first active agent + mandate
    const agent = db.prepare(`SELECT * FROM agents LIMIT 1`).get();
    const mandate = db.prepare(`SELECT * FROM mandates WHERE revoked = 0 LIMIT 1`).get();

    if (!agent || !mandate) {
      return res.status(400).json({ error: 'No agents or mandates found — run npm run seed first' });
    }

    const statuses = ['ALLOWED', 'ALLOWED', 'ALLOWED', 'PENDING', 'PENDING', 'BLOCKED', 'ALLOWED', 'APPROVED', 'DENIED', 'BLOCKED'];

    for (let i = 0; i < 10; i++) {
      const txnId = uid();
      const status = statuses[i];
      const amount = Math.floor(Math.random() * 8000) + 500;
      const payee = i % 3 === 0 ? 'payee_alpha' : i % 3 === 1 ? 'payee_beta' : 'payee_unknown';
      db.prepare(`
        INSERT INTO transactions (id, agent_id, mandate_id, amount, payee, status, risk_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(txnId, agent.id, mandate.id, amount, payee, status, Math.floor(Math.random() * 150));
    }

    res.json({ ok: true, message: 'DB reset and re-seeded', transactions: 10 });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed', detail: err.message });
  }
});

module.exports = router;
