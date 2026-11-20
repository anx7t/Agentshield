import express from 'express';
import db from '../db/init.js';

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM logs ORDER BY id ASC').all();
  res.json(rows);
});

export default router;
