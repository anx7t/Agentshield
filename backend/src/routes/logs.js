const express = require('express');
const { getDb } = require('../db/db_init');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = getDb().prepare(`
    SELECT
      l.id,
      l.transaction_id,
      l.action,
      l.performed_by,
      l.note,
      l.created_at,
      t.hash,
      t.prev_hash,
      t.amount,
      t.payee,
      t.status,
      t.risk_score
    FROM logs l
    LEFT JOIN transactions t ON t.id = l.transaction_id
    ORDER BY l.created_at ASC
  `).all();

  res.json(rows);
});

module.exports = router;
