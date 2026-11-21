# 🛡️ AgentShield

**A middleware firewall between AI agents and bank APIs.**
Every agent payment is signature-verified, risk-scored against a mandate, and then **ALLOWED**, held as **PENDING** for a human, or **BLOCKED** in real time. Every decision lands in a tamper-evident SHA-256 hash-chain audit log that the dashboard re-verifies in the browser.

> Built for **Hack N Pitch 2026** (Nov 21) · Cybersecurity track

---

## Why

AI agents are starting to move money. A compromised prompt, a buggy tool call or a rogue agent can drain an account in seconds. Banks have no layer that asks *"is this agent allowed to do this, right now?"* AgentShield is that layer.

```
AI Agent ──(HMAC-signed request)──▶ AgentShield ──(only if ALLOWED / APPROVED)──▶ Bank API
                                        │
                     verify sig → check mandate → score risk → hash-chain log
                                        │
                              React dashboard (human approval)
```

---

## Features

| Feature | How |
|---|---|
| Agent authentication | `HMAC-SHA256(agentId + payee + amount, secret)` checked on every request |
| Mandates | Per-agent spending limit + payee whitelist, revocable instantly |
| Risk engine | Rule-based score → ALLOWED / PENDING / BLOCKED |
| Human-in-the-loop | PENDING transactions approved or denied from the dashboard |
| Tamper-evident audit log | Every transaction appended to a SHA-256 hash chain |
| Client-side verification | Dashboard re-computes the chain with `SubtleCrypto` and flags any break |
| Live dashboard | Polls `/api/transactions` and `/api/logs` every 3 s |
| Attack simulators | Normal and rogue agents generate live traffic for the demo |

---

## Risk Engine

| Check | Points |
|---|---|
| `amount > mandate.max_amount` | +50 |
| Payee not in whitelist | +30 |
| Mandate revoked / missing | +100 |

| Score | Decision |
|---|---|
| `< 30` | ✅ **ALLOWED** — forwarded to bank |
| `30 – 69` | ⏳ **PENDING** — needs human approval |
| `≥ 70` | ⛔ **BLOCKED** — rejected immediately |

**Hash chain:** `hash = SHA-256(prev_hash ‖ id ‖ amount ‖ payee ‖ request_status)` — editing or deleting any row breaks every hash after it.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | Node.js · Express (port **3001**) |
| Database | SQLite · better-sqlite3 (raw SQL) |
| Security | HMAC-SHA256 request signing · SHA-256 hash chain |
| Frontend | React · Vite · Tailwind CSS (port **5173**) |
| Deploy | Railway (backend) · Vercel (frontend) |

---

## Project Structure

```
Agentshield/
├── backend/
│   ├── simulator/
│   │   ├── normalAgent.js     # valid traffic every 2s
│   │   └── rogueAgent.js      # over-limit, bad payee, forged agent
│   └── src/
│       ├── index.js           # Express entry
│       ├── db/                # schema.sql, db_init.js, seed.js
│       ├── engine/riskEngine.js
│       ├── middleware/verifyAgent.js   # HMAC verification
│       ├── utils/hashChain.js
│       └── routes/            # agents, mandates, transactions, logs
└── frontend/
    └── src/
        ├── api/client.js
        ├── pages/             # Dashboard, AuditLog
        └── components/        # TransactionList, ApprovePanel
```

---

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env        # PORT=3001
npm run seed
npm run dev                 # http://localhost:3001

# Frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173

# Live traffic (optional, separate terminals)
node backend/simulator/normalAgent.js
node backend/simulator/rogueAgent.js
```

Health check: `curl http://localhost:3001/api/health` → `{ "ok": true }`

Frontend env: `VITE_API_URL=http://localhost:3001` (set to the Railway URL in Vercel).

---

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/agent/register` | Register agent → `{ agentId, secret }` |
| `GET` | `/api/agents` | List agents with current mandate (no secrets) |
| `POST` | `/api/mandate` | Create mandate `{ agent_id, max_amount, allowed_payees }` |
| `DELETE` | `/api/mandate/:agentId` | Revoke agent's mandates |
| `POST` | `/api/transaction/request` | Signed request → `{ txnId, status, riskScore }` |
| `POST` | `/api/transaction/:id/approve` | Approve a PENDING txn |
| `POST` | `/api/transaction/:id/deny` | Deny a PENDING txn |
| `GET` | `/api/transactions` | All transactions, newest first |
| `GET` | `/api/logs` | Audit log with `hash` / `prev_hash` |
| `POST` | `/api/demo/reset` | Clear txns + logs, re-seed demo chain |
| `POST` | `/api/bank/transfer` | Mock bank endpoint |

**Signed transaction request**

```json
{
  "agent_id": "abc123",
  "amount": 1200,
  "payee": "payee_alpha",
  "signature": "HMAC-SHA256(secret, agent_id + payee + String(amount))"
}
```

---

## Status Reference

| Status | Meaning | Colour |
|---|---|---|
| ALLOWED | Passed risk check | 🟢 Green |
| PENDING | Awaiting human review | 🟡 Amber |
| BLOCKED | Rejected by engine | 🔴 Red |
| APPROVED | Approved by operator | 🔵 Blue |
| DENIED | Denied by operator | ⚪ Grey |

---

## Team

| Member | Role | Owns |
|---|---|---|
| **Ankit** | Backend (60%) | DB, risk engine, routes, `index.js` |
| **Aryan** | Backend (40%) | `hashChain.js`, `verifyAgent.js`, logs route, `api/client.js`, simulators |
| **Souvik** | Frontend (50%) | Dashboard, TransactionList, ApprovePanel, AuditLog, routing |
| **Sweta** | Frontend (50%) + Pitch | UI and pitch deck |

**Branches:** `security-code-+-intigration` (backend) · `frontend` (frontend)
