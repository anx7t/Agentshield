# AgentShield

A risk engine and mandate management system that governs AI agent transactions — scoring every request against a mandate policy and blocking, flagging, or allowing it in real time.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Backend](#backend)
  - [Tech Stack](#tech-stack)
  - [Database Schema](#database-schema)
  - [Risk Engine](#risk-engine)
  - [Setup & Run](#setup--run)
  - [API Reference](#api-reference)
  - [Simulators](#simulators)
- [Frontend](#frontend)
  - [Tech Stack](#tech-stack-1)
  - [Getting Started with Mock Data](#getting-started-with-mock-data)
  - [Connecting to the Backend](#connecting-to-the-backend)
  - [Pages & Components](#pages--components)
  - [Status Badge Reference](#status-badge-reference)
- [Running the Full System](#running-the-full-system)

---

## Project Overview

AgentShield sits between an AI agent and a payment/action system. Before any transaction goes through:

1. The agent submits a request with an `agent_id`, `amount`, and `payee`
2. The backend checks the agent's active **mandate** (spending rules)
3. The **risk engine** scores the request and returns `ALLOWED`, `PENDING`, or `BLOCKED`
4. Every decision is logged to an immutable hash chain

---

## Architecture

```
Agentshield/
├── README.md
└── backend/
    ├── package.json
    ├── mockData.js                    ← static JSON for frontend (no server needed)
    ├── .env.example
    ├── simulator/
    │   ├── normalAgent.js             ← fires valid transactions every 2s
    │   └── rogueAgent.js             ← fires bad transactions to trigger blocks
    └── src/
        ├── index.js                   ← Express entry point
        ├── db/
        │   ├── schema.sql             ← table definitions
        │   ├── db_init.js             ← opens SQLite, runs schema on startup
        │   └── seed.js               ← demo data (2 agents, 1 mandate, 10 txns)
        ├── engine/
        │   └── riskEngine.js          ← core scoring logic
        ├── middleware/
        │   └── verifyAgent.js         ← validates agent_id on every txn request
        └── routes/
            ├── agents.js              ← register agent, mock bank transfer
            ├── mandates.js            ← create/revoke mandates, list transactions
            ├── transactions.js        ← request, approve, deny
            └── logs.js               ← audit log with hash chain
```

---

## Backend

### Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite via `better-sqlite3` (no ORM, raw SQL)
- **Other:** `uid` for IDs, `dotenv` for config, `nodemon` for dev reload

### Database Schema

**`agents`** — registered AI agents
| Column | Type | Notes |
|---|---|---|
| id | TEXT | UUID |
| name | TEXT | |
| email | TEXT | unique |
| created_at | DATETIME | auto |

**`mandates`** — spending rules assigned to an agent
| Column | Type | Notes |
|---|---|---|
| id | TEXT | UUID |
| agent_id | TEXT | FK → agents |
| max_amount | REAL | transaction limit |
| allowed_payees | TEXT | JSON array of allowed payee IDs |
| revoked | INTEGER | 0 = active, 1 = revoked |
| created_at | DATETIME | auto |

**`transactions`** — every transaction request
| Column | Type | Notes |
|---|---|---|
| id | TEXT | UUID |
| agent_id | TEXT | FK → agents |
| mandate_id | TEXT | FK → mandates |
| amount | REAL | |
| payee | TEXT | |
| status | TEXT | ALLOWED / PENDING / BLOCKED / APPROVED / DENIED |
| risk_score | INTEGER | computed by risk engine |
| hash | TEXT | SHA-256 of this txn |
| prev_hash | TEXT | links to previous txn (hash chain) |
| created_at | DATETIME | auto |

**`logs`** — audit trail
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | autoincrement |
| transaction_id | TEXT | FK → transactions |
| action | TEXT | REQUEST / APPROVE / DENY |
| performed_by | TEXT | agent_id or "system" |
| note | TEXT | e.g. risk_score=30 |
| created_at | DATETIME | auto |

### Risk Engine

Located at `src/engine/riskEngine.js`. Takes a transaction and its mandate, returns a score and status.

| Check | Points |
|---|---|
| `amount > mandate.max_amount` | +50 |
| `payee` not in `allowed_payees` | +30 |
| Mandate is revoked | +100 |

| Score | Status |
|---|---|
| 0 | `ALLOWED` — auto-approved |
| 1 – 50 | `PENDING` — needs human review |
| 51+ | `BLOCKED` — rejected immediately |

### Setup & Run

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Copy env file (edit PORT if needed, default is 3000)
cp .env.example .env

# 3. Seed the database with demo data
npm run seed

# 4. Start the server
npm run dev        # with auto-reload (recommended for dev)
npm start          # without auto-reload
```

Verify it's running:
```bash
curl http://localhost:3000/api/health
# → { "ok": true }
```

### API Reference

#### Agent

**`POST /api/agent/register`**
```json
// Request
{ "name": "Aryan Bot", "email": "aryan@agentshield.io" }

// Response 201
{ "agentId": "abc123", "secret": "64-char-hex-string" }
```

#### Mandate

**`POST /api/mandate`**
```json
// Request
{ "agent_id": "abc123", "max_amount": 5000, "allowed_payees": ["payee_alpha", "payee_beta"] }

// Response 201
{ "mandateId": "xyz789" }
```

**`DELETE /api/mandate/:agentId`**
```json
// Response 200
{ "revoked": 2 }   // number of mandates revoked
```

#### Transactions

**`POST /api/transaction/request`**
```json
// Request
{ "agent_id": "abc123", "amount": 1200, "payee": "payee_alpha" }

// Response 201
{ "txnId": "txn_001", "status": "ALLOWED", "riskScore": 0 }
```

**`POST /api/transaction/:id/approve`**
```json
// Response 200
{ "txnId": "txn_001", "status": "APPROVED" }
```

**`POST /api/transaction/:id/deny`**
```json
// Response 200
{ "txnId": "txn_001", "status": "DENIED" }
```

**`GET /api/transactions`**
```json
// Response 200
{ "transactions": [ ...transaction objects, newest first ] }
```

#### Logs

**`GET /api/logs`**
```json
// Response 200
{
  "logs": [
    {
      "id": 1,
      "transaction_id": "txn_001",
      "action": "REQUEST",
      "performed_by": "abc123",
      "note": "risk_score=0",
      "created_at": "...",
      "hash": "sha256...",
      "prev_hash": "sha256...",
      "amount": 1200,
      "payee": "payee_alpha",
      "status": "ALLOWED",
      "risk_score": 0
    }
  ]
}
```

#### Mock Bank

**`POST /api/bank/transfer`**
```json
// Request
{ "amount": 1200, "payee": "payee_alpha" }

// Response 200
{ "success": true, "txRef": "uid-string" }
```

### Simulators

Run these while the server is live to generate realistic traffic.

```bash
# Terminal 1 — server
npm run dev

# Terminal 2 — fires valid transactions every 2s (always ALLOWED)
node simulator/normalAgent.js

# Terminal 3 — rotates 3 attack types every 2s
# over-limit → BLOCKED, bad payee → PENDING, forged agent → 404
node simulator/rogueAgent.js
```

---

## Frontend

### Tech Stack

> Fill in your chosen stack here (e.g. React + Vite, Next.js, etc.)

Suggested libraries:
- **HTTP:** `fetch` or `axios`
- **State:** React Query / Zustand / plain useState
- **UI:** Tailwind CSS or your component library

### Getting Started with Mock Data

You do **not** need the backend running to start building. Use the static mock data at `backend/mockData.js`:

```js
const { agents, mandates, transactions, apiShapes } = require('./backend/mockData');
```

Or copy the arrays directly — they match the exact shape the real API returns.

**Mock transactions cover all 5 statuses:** `ALLOWED`, `PENDING`, `BLOCKED`, `APPROVED`, `DENIED` — enough to build and style every state in the UI.

### Connecting to the Backend

Set your base URL in one place:

```js
const API = 'http://localhost:3000';
```

#### Register an agent
```js
const res = await fetch(`${API}/api/agent/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'My Agent', email: 'agent@example.com' }),
});
const { agentId, secret } = await res.json();
```

#### Create a mandate
```js
const res = await fetch(`${API}/api/mandate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_id: agentId,
    max_amount: 5000,
    allowed_payees: ['payee_alpha', 'payee_beta'],
  }),
});
const { mandateId } = await res.json();
```

#### Submit a transaction
```js
const res = await fetch(`${API}/api/transaction/request`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agent_id: agentId, amount: 1200, payee: 'payee_alpha' }),
});
const { txnId, status, riskScore } = await res.json();
```

#### Approve or deny a pending transaction
```js
await fetch(`${API}/api/transaction/${txnId}/approve`, { method: 'POST' });
await fetch(`${API}/api/transaction/${txnId}/deny`, { method: 'POST' });
```

#### Fetch all transactions
```js
const { transactions } = await (await fetch(`${API}/api/transactions`)).json();
```

#### Fetch audit logs
```js
const { logs } = await (await fetch(`${API}/api/logs`)).json();
```

### Pages & Components

Suggested views based on the data available:

| Page | What to show |
|---|---|
| **Dashboard** | Total transactions, counts by status, risk score distribution |
| **Transaction List** | Table of all transactions with status badges, sortable by date/amount |
| **Transaction Detail** | Single transaction — amount, payee, risk score, mandate used, approve/deny buttons |
| **Mandate Manager** | Active mandates per agent, create new mandate form, revoke button |
| **Audit Log** | Chronological log of REQUEST / APPROVE / DENY actions with hash chain |
| **Agent Registration** | Form to register a new agent and display returned agentId + secret |

### Status Badge Reference

| Status | Meaning | Suggested colour |
|---|---|---|
| `ALLOWED` | Passed risk check automatically | Green |
| `PENDING` | Flagged — needs human review | Yellow / Amber |
| `BLOCKED` | Rejected by risk engine | Red |
| `APPROVED` | Manually approved by operator | Blue |
| `DENIED` | Manually denied by operator | Grey |

---

## Running the Full System

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev     # adjust to your setup

# Terminal 3 — normal agent simulator (optional, generates live data)
cd backend && node simulator/normalAgent.js

# Terminal 4 — rogue agent simulator (optional, generates blocked txns)
cd backend && node simulator/rogueAgent.js
```

Backend runs on `http://localhost:3000` by default.
