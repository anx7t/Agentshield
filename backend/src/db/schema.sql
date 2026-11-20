CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mandates (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  max_amount REAL NOT NULL,
  allowed_payees TEXT,        -- JSON array of allowed payee ids
  revoked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  mandate_id TEXT,
  amount REAL NOT NULL,
  payee TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ALLOWED','PENDING','BLOCKED','APPROVED','DENIED')),
  risk_score INTEGER DEFAULT 0,
  hash TEXT,
  prev_hash TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (mandate_id) REFERENCES mandates(id)
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT,
  action TEXT NOT NULL,
  performed_by TEXT,
  note TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
