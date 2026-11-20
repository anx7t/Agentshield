// STUB: placeholder for Ankit — replace with his real version
const express = require('express');
const { initDb, getDb } = require('./db/db_init');
const agentRouter = require('./routes/agent');
const mandateRouter = require('./routes/mandate');
const transactionRouter = require('./routes/transaction');
const logsRouter = require('./routes/logs');

const app = express();
app.use(express.json());

initDb();

app.use('/api/agent', agentRouter);
app.use('/api/mandate', mandateRouter);
app.use('/api/transaction', transactionRouter);
app.use('/api/logs', logsRouter);

app.get('/api/transactions', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM transactions ORDER BY created_at DESC').all());
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AgentShield backend listening on port ${PORT}`));
