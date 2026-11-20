import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

export async function registerAgent(name) {
  const res = await api.post('/agent/register', { name });
  return res.data;
}

export async function createMandate(agentId, amountLimit, allowedPayees, expiresAt) {
  const res = await api.post('/mandate', { agentId, amountLimit, allowedPayees, expiresAt });
  return res.data;
}

export async function revokeMandate(agentId) {
  const res = await api.delete(`/mandate/${agentId}`);
  return res.data;
}

export async function requestTransaction(agentId, payee, amount, signature) {
  const res = await api.post('/transaction/request', { agentId, payee, amount, signature });
  return res.data;
}

export async function approveTransaction(txnId) {
  const res = await api.post(`/transaction/${txnId}/approve`);
  return res.data;
}

export async function denyTransaction(txnId) {
  const res = await api.post(`/transaction/${txnId}/deny`);
  return res.data;
}

export async function getLogs() {
  const res = await api.get('/logs');
  return res.data;
}

export async function getTransactions() {
  const res = await api.get('/transactions');
  return res.data;
}
