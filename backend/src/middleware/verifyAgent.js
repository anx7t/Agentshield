import crypto from 'crypto';
import db from '../db/init.js';

export function verifyAgent(req, res, next) {
  const { agentId, payee, amount, signature } = req.body;

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  if (!agent) {
    return res.status(401).json({ error: 'Invalid agent' });
  }

  const expectedSig = crypto
    .createHmac('sha256', agent.secret)
    .update(agentId + payee + String(amount))
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(401).json({ error: 'Invalid agent' });
  }

  req.agent = agent;
  next();
}
