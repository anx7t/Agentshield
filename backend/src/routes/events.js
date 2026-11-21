const express = require('express')
const { addClient } = require('../sse')

const router = express.Router()

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // tell nginx/proxies not to buffer
  res.flushHeaders()

  res.write('event: connected\ndata: {}\n\n')

  const remove = addClient(res)

  // Keep the connection alive through idle proxies
  const heartbeat = setInterval(() => {
    try { res.write(':heartbeat\n\n') } catch { clearInterval(heartbeat); remove() }
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    remove()
  })
})

module.exports = router
