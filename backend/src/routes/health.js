const express = require('express');
const { getDb } = require('../db/db_init');

const router = express.Router();

router.get('/', (req, res) => {
  let databaseStatus = 'connected';
  try {
    getDb().prepare('SELECT 1').get();
  } catch {
    databaseStatus = 'disconnected';
  }

  const body = {
    status: databaseStatus === 'connected' ? 'ok' : 'degraded',
    service: 'AgentShield Backend',
    timestamp: new Date().toISOString(),
    database: databaseStatus,
    uptime: process.uptime(),
  };

  res.status(databaseStatus === 'connected' ? 200 : 503).json(body);
});

router.get('/integration', (req, res) => {
  res.json({
    status: 'ok',
    frontendOrigin: 'http://localhost:5173',
    backendOrigin: 'http://localhost:3001',
    apiVersion: 'v1',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
