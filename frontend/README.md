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
| `getAgents()` | `GET /api/agents` | Every agent and its current mandate, merged with the secrets this browser holds. Agents without a secret here (simulators, other browsers) can have rules set or stopped, but can't be used for test payments. |
| `registerAgent(name)` | `POST /api/agent/register` `{ name, email }` | Email is generated (`<name>_<timestamp>@agentshield.io`). The returned secret is saved in `localStorage` — the backend only returns it once. |
| `createMandate(...)` | `POST /api/mandate` `{ agent_id, max_amount, allowed_payees }` | No expiry — the schema has no such column. |
| `revokeMandate(agentId)` | `DELETE /api/mandate/:agentId` | |
| `requestTransaction(...)` | `POST /api/transaction/request` `{ agent_id, amount, payee, signature }` | `signature = HMAC-SHA256(secret, agentId + payee + String(amount))`, computed with Web Crypto. A stopped agent's payment comes back `BLOCKED` with `reason` `mandate_revoked` / `no_mandate`. |
| `approveTransaction(id)` / `denyTransaction(id)` | `POST /api/transaction/:id/approve` \| `/deny` | Shown as buttons on payments that need approval (`PENDING`). |
| `getTransactions()` | `GET /api/transactions` | Payments list, approvals, stats and the tamper check. Polled every 3 s. |
| `getLogs()` | `GET /api/logs` | Activity history: one row per REQUEST / APPROVE / DENY. |
| `resetDemo()` | `POST /api/demo/reset` | Reset demo button. |

## Tamper check

The Activity history re-hashes every transaction in the browser (`src/api/hash.js`), matching `utils/hashChain.js`:

```
hash = sha256_hex(`${prev_hash || '0'}:${id}:${amount}:${payee}:${request_status}`)   // one chain per agent
```

`request_status` is the status at request time; approve/deny only change `status`. Rows from before that column existed
are checked against their current status, and `APPROVED`/`DENIED` ones also against `ALLOWED`/`PENDING`.
