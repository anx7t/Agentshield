-- STUB: placeholder schema for Ankit — replace with his real version
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  secret TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS mandates (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  amount_limit REAL,
  allowed_payees TEXT,
  expires_at INTEGER,
  revoked INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  payee TEXT,
  amount REAL,
  risk_score INTEGER,
  status TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT,
  data TEXT,
  prev_hash TEXT,
  hash TEXT,
  created_at INTEGER
);
