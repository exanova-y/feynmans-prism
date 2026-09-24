// The problem graph as a world: islands (nodes), bridges (requires-edges) and
// sandbars (pending proposals), with 2D positions. Pure and deterministic —
// the same snapshot always yields the same world, so every browser sees the
// same map without the coordinator having to store positions.
//
// Layout is a small force simulation: bridges and parent links attract,
// everything repels, iteration order is fixed by sorting ids. Positions are
// in pixels; the browser scales its camera, not the world.

import { PROBLEMS } from './data.ts'
import {
  buildTree,
  flatten,
  readySet,
  type EdgeKind,
  type GraphSnapshot,
  type NodeOrigin,
  type NodeStatus,
} from './tree.ts'

export interface Island {
  id: string
  text: string
  x: number
  y: number
  r: number // radius, from how much text the node carries
  seed: number // shape noise seed, from the id
  status: NodeStatus
  ready: boolean
  origin: NodeOrigin
  parentId: string | null
  depth: number
}

export interface Bridge {
  src: string
  dst: string
  weight: number
  kind: EdgeKind
}

export interface TrailView {
  a: string
  b: string
  walks: number
}

export interface Sandbar {
  id: number
  text: string
  x: number
  y: number
  proposer: string
  parentId: string | null
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface World {
  problemId: string
  title: string
  islands: Island[]
  bridges: Bridge[]
  sandbars: Sandbar[]
  trails: TrailView[]
  bounds: Bounds
}

const SPACING = 320 // ideal bridge length, px
const ITERATIONS = 300

// FNV-1a: a stable 32-bit hash of a string.
export function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

// mulberry32: a tiny seeded PRNG in [0, 1).
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Pt = { x: number; y: number }

// Islands start on a ring in a seeded order, so a layout never begins from
// coincident points and is stable across runs.
function initPositions(ids: string[]): Map<string, Pt> {
  const pts = new Map<string, Pt>()
  const radius = (SPACING * Math.max(ids.length, 3)) / (2 * Math.PI)
  ids.forEach((id, i) => {
    const r = rng(hash(id))
    const a = (2 * Math.PI * i) / ids.length + (r() - 0.5) * 0.3
    pts.set(id, { x: Math.cos(a) * radius * (0.8 + 0.4 * r()), y: Math.sin(a) * radius * (0.8 + 0.4 * r()) })
  })
  return pts
}

function repel(ids: string[], pts: Map<string, Pt>, force: Map<string, Pt>) {
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = pts.get(ids[i])!
      const b = pts.get(ids[j])!
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d = Math.max(Math.hypot(dx, dy), 1)
      const f = (SPACING * SPACING) / d / d
      force.get(ids[i])!.x += dx * f
      force.get(ids[i])!.y += dy * f
      force.get(ids[j])!.x -= dx * f
      force.get(ids[j])!.y -= dy * f
    }
  }
}

function attract(links: Array<[string, string]>, pts: Map<string, Pt>, force: Map<string, Pt>) {
  for (const [s, t] of links) {
    const a = pts.get(s)
    const b = pts.get(t)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.max(Math.hypot(dx, dy), 1)
    const f = (d - SPACING) / SPACING / 4
    force.get(s)!.x += dx * f
    force.get(s)!.y += dy * f
    force.get(t)!.x -= dx * f
    force.get(t)!.y -= dy * f
  }
}

// Gravity toward the origin, proportional to distance, so unconnected
// islands settle on a ring of a few SPACINGs instead of drifting apart.
const GRAVITY = 0.05

// One iteration: displacement capped at `temp`.
function step(ids: string[], pts: Map<string, Pt>, links: Array<[string, string]>, temp: number) {
  const force = new Map(ids.map((id) => [id, { x: 0, y: 0 }]))
  repel(ids, pts, force)
  attract(links, pts, force)
  for (const id of ids) {
    const p = pts.get(id)!
    const f = force.get(id)!
    const m = Math.max(Math.hypot(f.x, f.y), 1e-6)
    const k = Math.min(m, temp) / m
    p.x += f.x * k - p.x * GRAVITY
    p.y += f.y * k - p.y * GRAVITY
  }
}

export function layout(ids: string[], links: Array<[string, string]>): Map<string, Pt> {
  const sorted = ids.toSorted()
  const pts = initPositions(sorted)
  for (let i = 0; i < ITERATIONS; i++) step(sorted, pts, links, SPACING * (1 - i / ITERATIONS) + 1)
  for (const p of pts.values()) {
    p.x = Math.round(p.x)
    p.y = Math.round(p.y)
  }
  return pts
}

const radiusFor = (text: string) => Math.round(Math.min(90, Math.max(40, 30 + text.length / 4)))

function sandbarAt(parent: Pt | undefined, seed: number, i: number, n: number, bounds: Bounds): Pt {
  const r = rng(seed)
  if (parent) {
    const a = r() * 2 * Math.PI
    return { x: Math.round(parent.x + Math.cos(a) * 180), y: Math.round(parent.y + Math.sin(a) * 180) }
  }
  // No parent: out on the rim, spread evenly.
  const a = (2 * Math.PI * i) / Math.max(n, 1) + r()
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  const rad = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / 2 + 220
  return { x: Math.round(cx + Math.cos(a) * rad), y: Math.round(cy + Math.sin(a) * rad) }
}

function boundsOf(islands: Island[]): Bounds {
  if (!islands.length) return { minX: -300, minY: -300, maxX: 300, maxY: 300 }
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (const i of islands) {
    b.minX = Math.min(b.minX, i.x - i.r)
    b.minY = Math.min(b.minY, i.y - i.r)
    b.maxX = Math.max(b.maxX, i.x + i.r)
    b.maxY = Math.max(b.maxY, i.y + i.r)
  }
  return b
}

function sandbarsOf(snap: GraphSnapshot, pts: Map<string, Pt>, bounds: Bounds): Sandbar[] {
  const orphans = snap.pending.filter((p) => !(p.parentId && pts.has(p.parentId)))
  return snap.pending.map((p) => {
    const parent = p.parentId ? pts.get(p.parentId) : undefined
    const at = sandbarAt(parent, hash(`proposal/${p.id}`), orphans.indexOf(p), orphans.length, bounds)
    return { id: p.id, text: p.text, ...at, proposer: p.proposer, parentId: p.parentId }
  })
}

function islandsOf(snap: GraphSnapshot, pts: Map<string, Pt>): Island[] {
  const ready = readySet(snap)
  return flatten(buildTree(snap)).map(({ node, depth }) => ({
    id: node.id,
    text: node.text,
    ...pts.get(node.id)!,
    r: radiusFor(node.text),
    seed: hash(`${snap.problemId}/${node.id}`),
    status: node.status,
    ready: ready.has(node.id),
    origin: node.origin,
    parentId: node.parentId,
    depth,
  }))
}

export function buildWorld(snap: GraphSnapshot): World {
  const links: Array<[string, string]> = snap.edges.map((e) => [e.src, e.dst])
  for (const n of snap.nodes) if (n.parentId) links.push([n.id, n.parentId])
  const pts = layout(
    snap.nodes.map((n) => n.id),
    links,
  )
  const islands = islandsOf(snap, pts)
  const bounds = boundsOf(islands)
  const bridges: Bridge[] = snap.edges.map((e) => ({
    src: e.src,
    dst: e.dst,
    weight: e.weight,
    kind: e.kind,
  }))
  const trails: TrailView[] = (snap.trails ?? []).map((t) => ({ a: t.a, b: t.b, walks: t.walks }))
  const title = PROBLEMS.find((p) => p.id === snap.problemId)?.title ?? snap.problemId
  return {
    problemId: snap.problemId,
    title,
    islands,
    bridges,
    sandbars: sandbarsOf(snap, pts, bounds),
    trails,
    bounds,
  }
}
