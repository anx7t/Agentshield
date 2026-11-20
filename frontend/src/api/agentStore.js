// The backend has no "list agents" route and only returns an agent's secret once,
// at registration. We keep registered agents (and their current rules) in this browser.

function key(mode) {
  return `agentshield_agents_${mode}`
}

export function loadAgents(mode) {
  try {
    return JSON.parse(localStorage.getItem(key(mode))) ?? []
  } catch {
    return []
  }
}

function save(mode, agents) {
  try {
    localStorage.setItem(key(mode), JSON.stringify(agents))
  } catch {
    // Storage unavailable (private mode): agents only last for this page view.
  }
  return agents
}

export function addAgent(mode, agent) {
  return save(mode, [...loadAgents(mode), agent])
}

export function updateAgent(mode, id, patch) {
  return save(mode, loadAgents(mode).map((a) => (a.id === id ? { ...a, ...patch } : a)))
}

export function findAgent(mode, id) {
  return loadAgents(mode).find((a) => a.id === id)
}

export function removeAgent(mode, id) {
  return save(mode, loadAgents(mode).filter((a) => a.id !== id))
}
