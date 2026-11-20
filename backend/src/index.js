require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/db_init');

const mandateRoutes = require('./routes/mandates');
const transactionRoutes = require('./routes/transactions');
const agentRoutes = require('./routes/agents');
const logsRoutes = require('./routes/logs');
const demoRoutes = require('./routes/demo');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api', agentRoutes);
app.use('/api', mandateRoutes);
app.use('/api', transactionRoutes);
app.use('/api', logsRoutes);
app.use('/api', demoRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`AgentShield backend running on port ${PORT}`));
