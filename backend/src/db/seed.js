const { initDb } = require('./db_init');
const { uid } = require('uid');
const crypto = require('crypto');
const { seedTransactions } = require('./demoData');

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

// Seeded agents get secrets too, so they could sign requests like registered ones.
const secret = () => crypto.randomBytes(32).toString('hex');
db.prepare(`INSERT INTO agents (id, name, email, secret) VALUES (?, ?, ?, ?)`).run(
  agent1Id, 'Aryan Mehra', 'aryan@agentshield.io', secret()
);
db.prepare(`INSERT INTO agents (id, name, email, secret) VALUES (?, ?, ?, ?)`).run(
  agent2Id, 'Sweta Nair', 'sweta@agentshield.io', secret()
);

db.prepare(`
  INSERT INTO mandates (id, agent_id, max_amount, allowed_payees, revoked)
  VALUES (?, ?, ?, ?, ?)
`).run(mandate1Id, agent1Id, 5000, JSON.stringify(['payee_alpha', 'payee_beta']), 0);

seedTransactions(db, agent1Id, mandate1Id);

console.log('Seed complete. 2 agents, 1 mandate, 10 transactions inserted.');
