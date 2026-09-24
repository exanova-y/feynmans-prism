// Loopback bridge for the browser game: the pear streams its room over
// Server-Sent Events and takes the local player's pose back over POST, then
// gossips that pose to the other pears. No dependency, no exposure beyond
// 127.0.0.1.
//
//   GET  /events   text/event-stream, one JSON snapshot every 200 ms
//   POST /pose     {x, y, z, heading, form}
//   GET  /world?problem=<id> · GET /research · POST /explore · POST /walk   bridge-research.ts

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { exploreRequest, researchEvents, walkRequest, worldOf } from './bridge-research.ts'
import { broadcastControl } from './send.ts'
import { remotes, self } from './state.ts'
import type { Pose } from './wire.ts'

const SNAPSHOT_MS = 200
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function snapshot() {
  return {
    self: { id: self.id, name: self.name, user: self.user, pose: self.pose },
    peers: [...remotes].map(([id, r]) => ({
      id,
      name: r.name,
      user: r.user,
      joined: [...r.joined],
      pose: r.pose ?? null,
    })),
  }
}

function isPose(v: unknown): v is Pose {
  if (!v || typeof v !== 'object') return false
  const p = v as Record<string, unknown>
  return ['x', 'y', 'z', 'heading'].every((k) => typeof p[k] === 'number') && typeof p.form === 'string'
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
  })
}

function events(res: ServerResponse) {
  res.writeHead(200, { ...HEADERS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  const send = () => res.write(`data: ${JSON.stringify(snapshot())}\n\n`)
  send()
  const timer = setInterval(send, SNAPSHOT_MS)
  res.on('close', () => clearInterval(timer))
}

async function pose(req: IncomingMessage, res: ServerResponse) {
  let parsed: unknown = null
  try {
    parsed = JSON.parse(await readBody(req))
  } catch {
    // fall through to 400
  }
  if (!isPose(parsed)) return res.writeHead(400, HEADERS).end()
  const { x, y, z, heading, form } = parsed
  self.pose = { x, y, z, heading, form }
  broadcastControl({ t: 'pose', ...self.pose })
  res.writeHead(204, HEADERS).end()
}

function world(res: ServerResponse, url: URL) {
  const w = worldOf(url.searchParams.get('problem') ?? '')
  if (!w) return res.writeHead(404, HEADERS).end()
  res.writeHead(200, { ...HEADERS, 'Content-Type': 'application/json' }).end(JSON.stringify(w))
}

export function startBridge(port: number): Server {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (req.method === 'OPTIONS') return res.writeHead(204, HEADERS).end()
    if (req.method === 'GET' && url.pathname === '/events') return events(res)
    if (req.method === 'POST' && url.pathname === '/pose') return void pose(req, res)
    if (req.method === 'GET' && url.pathname === '/world') return world(res, url)
    if (req.method === 'GET' && url.pathname === '/research') return researchEvents(res, HEADERS)
    if (req.method === 'POST' && url.pathname === '/explore') return void exploreRequest(req, res, HEADERS)
    if (req.method === 'POST' && url.pathname === '/walk') return void walkRequest(req, res, HEADERS)
    res.writeHead(404, HEADERS).end()
  })
  server.on('error', () => {}) // a busy port just means no bridge for this pear
  server.listen(port, '127.0.0.1')
  return server
}
