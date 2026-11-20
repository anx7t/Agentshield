// STUB: placeholder for Ankit — replace with his real version
import express from 'express';
import db from './db/init.js';
import agentRouter from './routes/agent.js';
import mandateRouter from './routes/mandate.js';
import transactionRouter from './routes/transaction.js';
import logsRouter from './routes/logs.js';

const app = express();
app.use(express.json());

app.use('/api/agent', agentRouter);
app.use('/api/mandate', mandateRouter);
app.use('/api/transaction', transactionRouter);
app.use('/api/logs', logsRouter);

app.get('/api/transactions', (req, res) => {
  res.json(db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all());
});

const PORT = 3001;
app.listen(PORT, () => console.log(`AgentShield backend listening on port ${PORT}`));
