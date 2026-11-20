const { getDb } = require('../db/db_init');

function verifyAgent(req, res, next) {
  const agentId = req.body?.agent_id || req.query?.agent_id;
  if (!agentId) return res.status(400).json({ error: 'agent_id required' });

  const agent = getDb().prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  req.agent = agent;
  next();
}

module.exports = verifyAgent;
