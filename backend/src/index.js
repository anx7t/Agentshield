require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/db_init');

const mandateRoutes = require('./routes/mandates');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api', mandateRoutes);
app.use('/api', transactionRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`AgentShield backend running on port ${PORT}`));
