# AgentShield — Frontend

React + Vite + Tailwind. Pages: Landing (`/`), Login (`/login`, demo sign-in), Dashboard (`/dashboard`).

```bash
npm install
npm run dev        # http://localhost:5173  (start the backend first: cd backend && npm run dev)
```

## Backend connection

`/api/*` is proxied to `http://localhost:3000` (override with `VITE_BACKEND_URL`).
For a deployed backend, set `VITE_API_URL=https://<host>/api` to call it directly (CORS is enabled on the backend).

If the backend is unreachable, the client falls back to an in-browser copy of it (`src/api/mockServer.js`, same routes,
risk rules, signing and hash chain) and the header shows **Demo data** instead of **Connected**.
Force a mode with `VITE_API_MODE=real` or `VITE_API_MODE=mock`.

Calls made by `src/api/client.js` (contract from `backend/src/routes`):

| Function | Request | Notes |
|---|---|---|
| `registerAgent(name)` | `POST /api/agent/register` `{ name, email }` | Email is generated (`<name>_<timestamp>@agentshield.io`). Returned `{ agentId, secret }` is saved in `localStorage` — the backend has no "list agents" route and only returns the secret once. |
| `createMandate(...)` | `POST /api/mandate` `{ agent_id, max_amount, allowed_payees }` | No expiry — the schema has no such column. |
| `revokeMandate(agentId)` | `DELETE /api/mandate/:agentId` | |
| `requestTransaction(...)` | `POST /api/transaction/request` `{ agent_id, amount, payee, signature }` | `signature = HMAC-SHA256(secret, agentId + payee + String(amount))`, computed with Web Crypto. A 400 "No active mandate" (revoked agent) is shown as **Stopped**. |
| `approveTransaction(id)` / `denyTransaction(id)` | `POST /api/transaction/:id/approve` \| `/deny` | Shown as buttons on payments that need approval (`PENDING`). |
| `getTransactions()` | `GET /api/transactions` | Drives the Activity history. |
| `getLogs()` | `GET /api/logs` | Available; not used by the UI yet. |

## Tamper check

The Activity history re-hashes every transaction in the browser (`src/api/hash.js`), matching `routes/transactions.js`:

```
hash = sha256_hex(`${prev_hash || '0'}:${id}:${amount}:${payee}:${status}`)   // one chain per agent
```

Approve/deny change `status` after the hash is written, so `APPROVED`/`DENIED` rows are also checked against their
original `ALLOWED`/`PENDING` status. Rows with no hash (seed data) are listed but not part of any chain.
