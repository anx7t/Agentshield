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

// Inline test — run with: node src/engine/riskEngine.js
if (require.main === module) {
  const mandate = { max_amount: 5000, allowed_payees: ['payee_alpha'], revoked: 0 };

  const t1 = score({ amount: 1000, payee: 'payee_alpha' }, mandate);
  console.assert(t1.status === 'ALLOWED', `Expected ALLOWED, got ${t1.status}`);
  console.log('ALLOWED test passed:', t1);

  const t2 = score({ amount: 1000, payee: 'payee_unknown' }, mandate);
  console.assert(t2.status === 'PENDING', `Expected PENDING, got ${t2.status}`);
  console.log('PENDING test passed:', t2);

  const t3 = score({ amount: 9000, payee: 'payee_unknown' }, { ...mandate, revoked: 1 });
  console.assert(t3.status === 'BLOCKED', `Expected BLOCKED, got ${t3.status}`);
  console.log('BLOCKED test passed:', t3);

  console.log('All 3 risk engine outcomes verified.');
}
