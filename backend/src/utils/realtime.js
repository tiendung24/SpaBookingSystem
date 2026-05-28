import { WebSocketServer, WebSocket } from 'ws'
import { verifyAccessToken } from './auth.js'

let realtimeServer = null
const clientsByShopId = new Map()
const adminClients = new Set()

function getClientSet(shopId) {
  const key = String(shopId || '')
  if (!clientsByShopId.has(key)) {
    clientsByShopId.set(key, new Set())
  }
  return clientsByShopId.get(key)
}

function removeClient(ws) {
  if (ws?.role === 'admin') {
    adminClients.delete(ws)
  }
  const shopId = ws?.shopId ? String(ws.shopId) : ''
  if (shopId && clientsByShopId.has(shopId)) {
    const set = clientsByShopId.get(shopId)
    set.delete(ws)
    if (set.size === 0) clientsByShopId.delete(shopId)
  }
}

export function initRealtimeServer(httpServer) {
  if (realtimeServer) return realtimeServer

  realtimeServer = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (url.pathname !== '/ws') return

    realtimeServer.handleUpgrade(req, socket, head, (ws) => {
      realtimeServer.emit('connection', ws, req)
    })
  })

  realtimeServer.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`)
      const token = url.searchParams.get('token') || ''
      if (!token) {
        ws.close(1008, 'Missing token')
        return
      }

      const payload = verifyAccessToken(token)
      if (!payload || !['shop', 'admin'].includes(payload.role)) {
        ws.close(1008, 'Unauthorized')
        return
      }

      ws.role = String(payload.role)
      ws.userId = String(payload.userId || '')
      if (ws.role === 'shop') {
        if (!payload.shopId) {
          ws.close(1008, 'Unauthorized')
          return
        }
        ws.shopId = String(payload.shopId)
        getClientSet(ws.shopId).add(ws)
      } else {
        adminClients.add(ws)
      }

      ws.send(JSON.stringify({ type: 'realtime.ready', role: ws.role, shopId: ws.shopId || null }))

      ws.on('close', () => removeClient(ws))
      ws.on('error', () => removeClient(ws))
    } catch {
      ws.close(1008, 'Unauthorized')
    }
  })

  return realtimeServer
}

export function broadcastToShop(shopId, message) {
  const set = clientsByShopId.get(String(shopId || ''))
  if (!set || set.size === 0) return

  const payload = JSON.stringify(message)
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    } else {
      removeClient(ws)
    }
  }
}

export function broadcastToAdmins(message) {
  if (!adminClients.size) return

  const payload = JSON.stringify(message)
  for (const ws of adminClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    } else {
      adminClients.delete(ws)
    }
  }
}
