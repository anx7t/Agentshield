const express = require('express');
const { seedTransactions } = require('../db/demoData');
const { getDb } = require('../db/db_init');
const { broadcast } = require('../sse');

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

    // Re-seed 10 chained demo transactions (with logs) against the first agent that has an active mandate
    const mandate = db.prepare(`SELECT * FROM mandates WHERE revoked = 0 ORDER BY created_at ASC, rowid ASC LIMIT 1`).get();
    const agent = mandate && db.prepare(`SELECT * FROM agents WHERE id = ?`).get(mandate.agent_id);

    if (!agent || !mandate) {
      return res.status(400).json({ error: 'No agents or mandates found — run npm run seed first' });
    }

    const count = seedTransactions(db, agent.id, mandate.id);

    broadcast('reset', {})
    res.json({ ok: true, message: 'DB reset and re-seeded', transactions: count });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed', detail: err.message });
  }
});

module.exports = router;
