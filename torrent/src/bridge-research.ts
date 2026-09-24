// The research half of the loopback bridge: the problem graphs as worlds for
// the browser game, and the explore request a player makes by sailing off
// the map. The pear that serves this may or may not be the coordinator;
// `propose` in presence.ts sends the proposals the right way either way.
//
//   GET  /world?problem=<id>   one world (islands, bridges, sandbars)
//   GET  /research             text/event-stream: `world` events, every
//                              problem on connect and again on each change
//   POST /explore              {problemId, anchors: [{id, weight}]}
//   POST /walk                 {problemId, a, b}: the player went from a to b

import type { IncomingMessage, ServerResponse } from 'node:http'
import { PROBLEMS } from './data.ts'
import { explore, normalizeTitle, type Anchor } from './explore.ts'
import { propose, walk } from './presence.ts'
import { graphs, graphVersion } from './state.ts'
import type { GraphSnapshot } from './tree.ts'
import { buildWorld } from './world.ts'

const POLL_MS = 500

export function worldOf(problemId: string) {
  const snap = graphs.get(problemId)
  return snap ? buildWorld(snap) : null
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
  })
}

export function researchEvents(res: ServerResponse, headers: Record<string, string>) {
  res.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  let sent = -1
  const send = () => {
    if (sent === graphVersion.n) return
    sent = graphVersion.n
    for (const snap of graphs.values())
      res.write(`event: world\ndata: ${JSON.stringify(buildWorld(snap))}\n\n`)
  }
  send()
  const timer = setInterval(send, POLL_MS)
  res.on('close', () => clearInterval(timer))
}

// Titles already on this problem's map, normalized, so exploration never
// proposes an island twice. Proposal texts carry "[year] title (url)".
const bare = (text: string) =>
  normalizeTitle(text.replace(/^\[\d{4}\] /, '').replace(/ \(https?:\/\/\S+\)$/, ''))
function knownTitles(snap: GraphSnapshot): Set<string> {
  const out = new Set<string>()
  for (const n of snap.nodes) out.add(bare(n.text))
  for (const p of snap.pending) out.add(bare(p.text))
  return out
}

interface ExploreBody {
  problemId?: string
  anchors?: Array<{ id: string; weight: number }>
}

function anchorsOf(snap: GraphSnapshot, body: ExploreBody): Anchor[] {
  const out: Anchor[] = []
  for (const a of body.anchors ?? []) {
    const node = snap.nodes.find((n) => n.id === a.id)
    if (node && typeof a.weight === 'number') out.push({ id: node.id, text: node.text, weight: a.weight })
  }
  return out
}

export async function exploreRequest(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const json = (status: number, payload: unknown) => {
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json' })
    res.end(JSON.stringify(payload))
  }
  let body: ExploreBody = {}
  try {
    body = JSON.parse((await readBody(req)) || '{}')
  } catch {
    return json(400, { error: 'bad json' })
  }
  const snap = body.problemId ? graphs.get(body.problemId) : undefined
  if (!snap) return json(404, { error: 'unknown problem; is a coordinator in the room?' })
  const anchors = anchorsOf(snap, body)
  if (!anchors.length) return json(400, { error: 'no anchors' })
  const parentId = anchors.toSorted((a, b) => b.weight - a.weight)[0].id
  const domain = PROBLEMS.find((p) => p.id === snap.problemId)?.title ?? ''
  try {
    const { query, proposals } = await explore(anchors, knownTitles(snap), undefined, 6, domain)
    for (const text of proposals) propose(snap.problemId, text, parentId)
    json(200, { query, parentId, proposed: proposals.length, proposals })
  } catch (err) {
    json(502, { error: String(err) })
  }
}

export async function walkRequest(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  let body: { problemId?: unknown; a?: unknown; b?: unknown } = {}
  try {
    body = JSON.parse((await readBody(req)) || '{}')
  } catch {
    return res.writeHead(400, headers).end()
  }
  const { problemId, a, b } = body
  const snap = typeof problemId === 'string' ? graphs.get(problemId) : undefined
  const known = (id: unknown) => typeof id === 'string' && snap?.nodes.some((n) => n.id === id)
  if (!snap || !known(a) || !known(b) || a === b) return res.writeHead(400, headers).end()
  walk(snap.problemId, a as string, b as string)
  res.writeHead(204, headers).end()
}
