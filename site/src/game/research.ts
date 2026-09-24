// The research graph as an archipelago in the southwest sea. The pear's
// bridge streams each problem as a world (torrent/src/world.ts): islands
// are subproblems, causeways are requires-edges, roads are edges worn in by
// walking, faint trails are walks that are not yet roads, shoals are
// proposals pending review. Positions arrive in layout pixels and are
// scaled onto the sea around one centre per problem.
//
// Walking from one island to another is reported to the bridge; enough
// walks between the same two islands make a road, and the layout then pulls
// them closer, so the map remembers the paths people take.

import * as THREE from 'three'
import { nameLabel } from './figures.ts'
import { PALETTE, cylinder, lighthouse, roundTree, type Collider } from './props.ts'

interface Island {
  id: string
  text: string
  x: number
  y: number
  r: number
  status: 'open' | 'solved' | 'retired'
  ready: boolean
}
interface Bridge {
  src: string
  dst: string
  weight: number
  kind: 'requires' | 'road'
}
interface Sandbar {
  id: number
  text: string
  x: number
  y: number
  proposer: string
}
interface Trail {
  a: string
  b: string
  walks: number
}
interface World {
  problemId: string
  title: string
  islands: Island[]
  bridges: Bridge[]
  sandbars: Sandbar[]
  trails: Trail[]
}

export interface Placed {
  problemId: string
  title: string
  id: string
  text: string
  status: string
  ready: boolean
  x: number
  z: number
  r: number
}

const SCALE = 0.075 // layout px → world units
const CENTERS = [
  { x: -190, z: 110 },
  { x: -110, z: 195 },
  { x: -215, z: 200 },
] // open sea, southwest of Arcadia
const ROAD_AFTER = 3
const RETRY_MS = 10_000
const SAND = 0xd8c9a0
const STATUS_COLOR = { solved: 0xd9b64a, retired: 0x3a4a52, ready: 0x8fb36a, blocked: 0x8a9aa0 }

export class Research {
  readonly group = new THREE.Group()
  colliders: Collider[] = []
  placed: Placed[] = []
  private worlds = new Map<string, World>()
  private source: EventSource | null = null
  private retry: number | undefined
  private last: Placed | null = null
  private readonly url: string

  constructor(url: string) {
    this.url = url
    this.connect()
  }

  private connect() {
    this.source = new EventSource(`${this.url}/research`)
    this.source.addEventListener('world', (e) => this.setWorld(JSON.parse((e as MessageEvent).data)))
    this.source.onerror = () => {
      this.source?.close()
      this.source = null
      this.retry = window.setTimeout(() => this.connect(), RETRY_MS)
    }
  }

  private setWorld(w: World) {
    this.worlds.set(w.problemId, w)
    this.group.clear()
    this.colliders = []
    this.placed = []
    const ids = [...this.worlds.keys()].toSorted()
    ids.forEach((id, i) => this.build(this.worlds.get(id)!, CENTERS[i % CENTERS.length]))
  }

  private build(w: World, c: { x: number; z: number }) {
    const at = new Map<string, { x: number; z: number }>()
    for (const i of w.islands) {
      const p = { x: c.x + i.x * SCALE, z: c.z + i.y * SCALE }
      at.set(i.id, p)
      const r = Math.max(2.5, i.r * SCALE)
      this.group.add(islet(i, p, r))
      this.colliders.push({ x: p.x, z: p.z, r })
      this.placed.push({ problemId: w.problemId, title: w.title, id: i.id, text: i.text, status: i.status, ready: i.ready, ...p, r })
    }
    const roads = new Set(w.bridges.map((b) => [b.src, b.dst].toSorted().join('|')))
    for (const b of w.bridges) {
      const a = at.get(b.src)
      const d = at.get(b.dst)
      if (a && d) this.group.add(causeway(a, d, b.kind === 'road' ? PALETTE.wood : PALETTE.stone, 0.7, 1))
    }
    for (const t of w.trails) {
      const a = at.get(t.a)
      const d = at.get(t.b)
      if (a && d && !roads.has([t.a, t.b].toSorted().join('|')))
        this.group.add(causeway(a, d, PALETTE.trim, 0.3, Math.min(1, t.walks / ROAD_AFTER) * 0.8))
    }
    for (const s of w.sandbars) this.group.add(shoal(s, { x: c.x + s.x * SCALE, z: c.z + s.y * SCALE }))
  }

  near(pos: THREE.Vector3): Placed | null {
    let best: Placed | null = null
    let bestD = Number.POSITIVE_INFINITY
    for (const p of this.placed) {
      const d = Math.hypot(pos.x - p.x, pos.z - p.z) - p.r
      if (d < 3 && d < bestD) {
        bestD = d
        best = p
      }
    }
    return best
  }

  // Arriving at a different island of the same problem than the last one
  // visited is a walk between the two.
  update(pos: THREE.Vector3) {
    const here = this.near(pos)
    if (!here || (this.last && this.last.problemId === here.problemId && this.last.id === here.id)) return
    if (this.last && this.last.problemId === here.problemId) this.walk(here.problemId, this.last.id, here.id)
    this.last = here
  }

  private walk(problemId: string, a: string, b: string) {
    fetch(`${this.url}/walk`, { method: 'POST', body: JSON.stringify({ problemId, a, b }), keepalive: true }).catch(
      () => {},
    )
  }

  dispose() {
    this.source?.close()
    window.clearTimeout(this.retry)
  }
}

// ✓ a lighthouse, ○ a tree, · mist, ✗ dark rock: the same legend as the TUI.
function islet(i: Island, p: { x: number; z: number }, r: number) {
  const g = new THREE.Group()
  g.position.set(p.x, 0, p.z)
  g.add(cylinder(r * 1.1, 1.6, SAND, 0.4, 9))
  const tone = i.status === 'open' ? (i.ready ? STATUS_COLOR.ready : STATUS_COLOR.blocked) : STATUS_COLOR[i.status]
  g.add(cylinder(r * 0.7, 0.5, tone, 1.4, 9))
  if (i.status === 'solved') {
    const l = lighthouse()
    l.scale.setScalar(0.35)
    l.position.y = 1.6
    g.add(l)
  } else if (i.ready) {
    const t = roundTree(true)
    t.scale.setScalar(0.6)
    t.position.y = 1.6
    g.add(t)
  } else if (i.status === 'open') {
    const mist = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.2, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xdde6ea, transparent: true, opacity: 0.35, depthWrite: false }),
    )
    mist.position.y = 1.2
    g.add(mist)
  }
  const label = nameLabel(i.id)
  label.position.y = 4.2
  label.scale.set(3, 0.75, 1)
  g.add(label)
  return g
}

function causeway(a: { x: number; z: number }, b: { x: number; z: number }, color: number, width: number, opacity: number) {
  const d = Math.hypot(b.x - a.x, b.z - a.z)
  const material = new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 })
  const m = new THREE.Mesh(new THREE.BoxGeometry(d, 0.3, width), material)
  m.position.set((a.x + b.x) / 2, 0.35, (a.z + b.z) / 2)
  m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
  m.receiveShadow = true
  return m
}

function shoal(s: Sandbar, p: { x: number; z: number }) {
  const g = new THREE.Group()
  g.position.set(p.x, 0, p.z)
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3.4, 0.25, 9),
    new THREE.MeshLambertMaterial({ color: SAND, transparent: true, opacity: 0.55 }),
  )
  m.position.y = 0.05
  g.add(m)
  const label = nameLabel(`#${s.id}`)
  label.position.y = 2.2
  label.scale.set(2.4, 0.6, 1)
  g.add(label)
  return g
}
