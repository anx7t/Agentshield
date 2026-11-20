const crypto = require('crypto');

function appendHash(txnData, prevHash) {
  const payload = `${prevHash || '0'}:${txnData.id}:${txnData.amount}:${txnData.payee}:${txnData.status}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

module.exports = { appendHash };
