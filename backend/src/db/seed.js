const { initDb } = require('./db_init');
const { uid } = require('uid');

const db = initDb();

db.exec(`
  DELETE FROM logs;
  DELETE FROM transactions;
  DELETE FROM mandates;
  DELETE FROM agents;
`);

const agent1Id = uid();
const agent2Id = uid();
const mandate1Id = uid();

db.prepare(`INSERT INTO agents (id, name, email) VALUES (?, ?, ?)`).run(
  agent1Id, 'Aryan Mehra', 'aryan@agentshield.io'
);
db.prepare(`INSERT INTO agents (id, name, email) VALUES (?, ?, ?)`).run(
  agent2Id, 'Sweta Nair', 'sweta@agentshield.io'
);

db.prepare(`
  INSERT INTO mandates (id, agent_id, max_amount, allowed_payees, revoked)
  VALUES (?, ?, ?, ?, ?)
`).run(mandate1Id, agent1Id, 5000, JSON.stringify(['payee_alpha', 'payee_beta']), 0);

const statuses = ['ALLOWED', 'ALLOWED', 'ALLOWED', 'PENDING', 'PENDING', 'BLOCKED', 'ALLOWED', 'APPROVED', 'DENIED', 'BLOCKED'];

for (let i = 0; i < 10; i++) {
  const txnId = uid();
  const status = statuses[i];
  const amount = Math.floor(Math.random() * 8000) + 500;
  const payee = i % 3 === 0 ? 'payee_alpha' : i % 3 === 1 ? 'payee_beta' : 'payee_unknown';
  db.prepare(`
    INSERT INTO transactions (id, agent_id, mandate_id, amount, payee, status, risk_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(txnId, agent1Id, mandate1Id, amount, payee, status, Math.floor(Math.random() * 150));
}

console.log('Seed complete. 2 agents, 1 mandate, 10 transactions inserted.');
