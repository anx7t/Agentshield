// STUB: placeholder for Ankit — replace with his real version
export function score(txn, mandate) {
  let s = 0;
  if (txn.amount > mandate.amountLimit) s += 50;
  if (!mandate.allowedPayees.includes(txn.payee)) s += 30;
  if (mandate.revoked) s += 100;
  return s < 30 ? 'ALLOWED' : s < 70 ? 'PENDING' : 'BLOCKED';
}
