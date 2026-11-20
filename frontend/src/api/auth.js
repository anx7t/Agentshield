// Mock auth — no real login. Any email/password is accepted.
const KEY = 'agentshield_user'

export function login(email) {
  try { sessionStorage.setItem(KEY, email) } catch { /* storage unavailable */ }
}

export function logout() {
  try { sessionStorage.removeItem(KEY) } catch { /* storage unavailable */ }
}

export function currentUser() {
  try { return sessionStorage.getItem(KEY) } catch { return null }
}

export function isLoggedIn() {
  return Boolean(currentUser())
}
