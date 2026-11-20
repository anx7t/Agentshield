// Static mock data for frontend team (Souvik & Sweta)
// Mirrors the shape of real API responses

const agents = [
  { id: 'agent_001', name: 'Aryan Mehra', email: 'aryan@agentshield.io', created_at: '2026-11-20T10:00:00Z' },
  { id: 'agent_002', name: 'Sweta Nair',  email: 'sweta@agentshield.io', created_at: '2026-11-20T10:05:00Z' },
];

const mandates = [
  {
    id: 'mandate_001',
    agent_id: 'agent_001',
    max_amount: 5000,
    allowed_payees: ['payee_alpha', 'payee_beta'],
    revoked: 0,
    created_at: '2026-11-20T10:10:00Z',
  },
];

const transactions = [
  { id: 'txn_001', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 1200, payee: 'payee_alpha',   status: 'ALLOWED',  risk_score: 0,   created_at: '2026-11-20T10:15:00Z' },
  { id: 'txn_002', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 3400, payee: 'payee_beta',    status: 'ALLOWED',  risk_score: 0,   created_at: '2026-11-20T10:16:00Z' },
  { id: 'txn_003', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 6000, payee: 'payee_alpha',   status: 'BLOCKED',  risk_score: 50,  created_at: '2026-11-20T10:17:00Z' },
  { id: 'txn_004', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 2000, payee: 'payee_unknown', status: 'PENDING',  risk_score: 30,  created_at: '2026-11-20T10:18:00Z' },
  { id: 'txn_005', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 500,  payee: 'payee_beta',    status: 'ALLOWED',  risk_score: 0,   created_at: '2026-11-20T10:19:00Z' },
  { id: 'txn_006', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 7500, payee: 'payee_unknown', status: 'BLOCKED',  risk_score: 130, created_at: '2026-11-20T10:20:00Z' },
  { id: 'txn_007', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 900,  payee: 'payee_alpha',   status: 'ALLOWED',  risk_score: 0,   created_at: '2026-11-20T10:21:00Z' },
  { id: 'txn_008', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 4800, payee: 'payee_beta',    status: 'PENDING',  risk_score: 30,  created_at: '2026-11-20T10:22:00Z' },
  { id: 'txn_009', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 1100, payee: 'payee_alpha',   status: 'APPROVED', risk_score: 0,   created_at: '2026-11-20T10:23:00Z' },
  { id: 'txn_010', agent_id: 'agent_001', mandate_id: 'mandate_001', amount: 3300, payee: 'payee_unknown', status: 'DENIED',   risk_score: 80,  created_at: '2026-11-20T10:24:00Z' },
];

// API response shapes
const apiShapes = {
  'POST /api/mandate': {
    request:  { agent_id: 'string', max_amount: 'number', allowed_payees: ['string'] },
    response: { mandateId: 'string' },
  },
  'DELETE /api/mandate/:agentId': {
    response: { revoked: 'number (count of mandates revoked)' },
  },
  'GET /api/transactions': {
    response: { transactions: '[...transaction objects]' },
  },
  'POST /api/transaction/request': {
    request:  { agent_id: 'string', amount: 'number', payee: 'string' },
    response: { txnId: 'string', status: 'ALLOWED|PENDING|BLOCKED', riskScore: 'number' },
  },
  'POST /api/transaction/:id/approve': {
    response: { txnId: 'string', status: 'APPROVED' },
  },
  'POST /api/transaction/:id/deny': {
    response: { txnId: 'string', status: 'DENIED' },
  },
};

module.exports = { agents, mandates, transactions, apiShapes };
