// Plain-language labels for backend transaction statuses.
export const STATUS = {
  ALLOWED: { text: 'Allowed', short: 'Allowed', tone: 'ok' },
  PENDING: { text: 'Needs your approval', short: 'Waiting', tone: 'warn' },
  BLOCKED: { text: 'Stopped', short: 'Stopped', tone: 'bad' },
  APPROVED: { text: 'Approved by you', short: 'Approved', tone: 'ok' },
  DENIED: { text: 'Denied by you', short: 'Denied', tone: 'bad' },
}

export const TONE_TEXT = { ok: 'text-allowed', warn: 'text-pending', bad: 'text-blocked' }

export const TONE_BADGE = {
  ok: 'border-allowed/50 bg-allowed/10 text-allowed',
  warn: 'border-pending/50 bg-pending/10 text-pending',
  bad: 'border-blocked/60 bg-blocked/15 text-blocked',
}

export const statusOf = (s) => STATUS[s] ?? { text: s, short: s, tone: 'warn' }

// Risk score: 0–29 low (green), 30–69 medium (yellow), 70+ high (red).
export const riskTone = (score) => (score >= 70 ? 'bad' : score >= 30 ? 'warn' : 'ok')
export const TONE_BG = { ok: 'bg-allowed', warn: 'bg-pending', bad: 'bg-blocked' }
