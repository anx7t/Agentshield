// Static demo rows from Aryan's backend/mockData.js, used to seed demo-data mode
// so the dashboard isn't empty when the backend isn't running.
export const seedTransactions = [
  { id: 'txn_001', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 1200, payee: 'payee_alpha', status: 'ALLOWED', risk_score: 0, created_at: '2026-11-20T10:15:00Z' },
  { id: 'txn_002', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 3400, payee: 'payee_beta', status: 'ALLOWED', risk_score: 0, created_at: '2026-11-20T10:16:00Z' },
  { id: 'txn_003', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 6000, payee: 'payee_alpha', status: 'BLOCKED', risk_score: 50, created_at: '2026-11-20T10:17:00Z' },
  { id: 'txn_004', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 2000, payee: 'payee_unknown', status: 'PENDING', risk_score: 30, created_at: '2026-11-20T10:18:00Z' },
  { id: 'txn_005', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 500, payee: 'payee_beta', status: 'ALLOWED', risk_score: 0, created_at: '2026-11-20T10:19:00Z' },
  { id: 'txn_006', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 7500, payee: 'payee_unknown', status: 'BLOCKED', risk_score: 130, created_at: '2026-11-20T10:20:00Z' },
  { id: 'txn_007', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 900, payee: 'payee_alpha', status: 'ALLOWED', risk_score: 0, created_at: '2026-11-20T10:21:00Z' },
  { id: 'txn_008', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 4800, payee: 'payee_beta', status: 'PENDING', risk_score: 30, created_at: '2026-11-20T10:22:00Z' },
  { id: 'txn_009', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 1100, payee: 'payee_alpha', status: 'APPROVED', risk_score: 0, created_at: '2026-11-20T10:23:00Z' },
  { id: 'txn_010', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 3300, payee: 'payee_unknown', status: 'DENIED', risk_score: 80, created_at: '2026-11-20T10:24:00Z' },
]
