const clients = new Set()

function addClient(res) {
  clients.add(res)
  return () => clients.delete(res)
}

function broadcast(event, data = {}) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of clients) {
    try { res.write(payload) } catch { /* client already disconnected */ }
  }
}

module.exports = { addClient, broadcast }
