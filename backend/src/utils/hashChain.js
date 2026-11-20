import crypto from 'crypto';

const GENESIS_HASH = '0000000000000000';

export function appendLog(db, action, data, prevHash) {
  const base = prevHash || GENESIS_HASH;
  const hash = crypto
    .createHash('sha256')
    .update(base + action + JSON.stringify(data))
    .digest('hex');

  db.prepare(
    'INSERT INTO logs (action, data, prev_hash, hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(action, JSON.stringify(data), base, hash, Date.now());

  return hash;
}
