function score(txn, mandate) {
  let riskScore = 0;

  // Amount exceeds mandate max
  if (txn.amount > mandate.max_amount) riskScore += 50;

  // Payee not in allowed list
  const allowedPayees = typeof mandate.allowed_payees === 'string'
    ? JSON.parse(mandate.allowed_payees)
    : (mandate.allowed_payees || []);

  if (allowedPayees.length > 0 && !allowedPayees.includes(txn.payee)) riskScore += 30;

  // Mandate is revoked
  if (mandate.revoked) riskScore += 100;

  let status;
  if (riskScore === 0) status = 'ALLOWED';
  else if (riskScore <= 50) status = 'PENDING';
  else status = 'BLOCKED';

  return { score: riskScore, status };
}

module.exports = { score };
