# AgentShield

Risk engine and mandate management system for AI agent transactions.

## Architecture

```
backend/
├── src/
│   ├── index.js              # Express server entry point
│   ├── db/
│   │   ├── schema.sql        # agents, mandates, transactions, logs tables
│   │   ├── db_init.js        # opens SQLite DB, runs schema on startup
│   │   └── seed.js           # inserts demo agents, mandates, transactions
│   ├── engine/
│   │   └── riskEngine.js     # score(txn, mandate) → ALLOWED / PENDING / BLOCKED
│   ├── middleware/
│   │   └── verifyAgent.js    # validates agent_id on transaction requests
│   └── routes/
│       ├── agents.js         # POST /api/agent/register, POST /api/bank/transfer
│       ├── mandates.js       # POST/DELETE /api/mandate, GET /api/transactions
│       ├── transactions.js   # POST /api/transaction/request, approve, deny
│       └── logs.js           # GET /api/logs
├── simulator/
│   ├── normalAgent.js        # fires valid transactions every 2s
│   └── rogueAgent.js         # fires over-limit / bad-payee / forged requests
├── mockData.js               # static JSON for frontend team
└── data/                     # SQLite DB file (gitignored)
```

**Stack:** Node.js · Express · better-sqlite3 (SQLite) · no ORM

**Risk scoring:**
| Trigger | Score added |
|---|---|
| Amount exceeds mandate max | +50 |
| Payee not in allowed list | +30 |
| Mandate revoked | +100 |

Score 0 → `ALLOWED` · Score 1–50 → `PENDING` · Score 51+ → `BLOCKED`

## How to run

```bash
cd backend
cp .env.example .env      # set PORT if needed (default 3000)
npm install
npm run seed              # populate DB with demo data
npm run dev               # start with nodemon (auto-reload)
# or
npm start                 # start without auto-reload
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| POST | `/api/agent/register` | Register agent, returns `agentId` + `secret` |
| POST | `/api/mandate` | Create mandate for an agent |
| DELETE | `/api/mandate/:agentId` | Revoke all mandates for an agent |
| GET | `/api/transactions` | List all transactions (newest first) |
| POST | `/api/transaction/request` | Submit transaction — runs risk engine |
| POST | `/api/transaction/:id/approve` | Approve a PENDING/ALLOWED transaction |
| POST | `/api/transaction/:id/deny` | Deny a PENDING/ALLOWED transaction |
| POST | `/api/bank/transfer` | Mock bank transfer (returns txRef) |
| GET | `/api/logs` | All audit logs with hash chain |

## Simulators

```bash
# Terminal 1 — start server
npm run dev

# Terminal 2 — normal agent (valid transactions)
node simulator/normalAgent.js

# Terminal 3 — rogue agent (triggers PENDING/BLOCKED)
node simulator/rogueAgent.js
```
