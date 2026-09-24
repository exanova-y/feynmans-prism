import assert from 'node:assert/strict'
import { it } from 'node:test'
import { PROBLEMS } from '../src/data.ts'
import { Graph } from '../src/graph.ts'
import { buildWorld, hash, layout, rng } from '../src/world.ts'

const P = 'credit-assignment'

function snapshot() {
  const g = new Graph()
  g.seed(PROBLEMS)
  g.link(P, 'q2', 'q1')
  g.setStatus(P, 'q1', 'solved')
  g.addNode(P, 'child', { parentId: 'q3', origin: 'fragment' })
  g.propose(P, 'q2', 'near q2', 'Thrace')
  g.propose(P, null, 'on the rim', 'Diana')
  g.walk(P, 'q3', 'q4')
  const snap = g.snapshot(P)
  g.close()
  return snap
}

it('hash and rng are stable', () => {
  assert.equal(hash('q1'), hash('q1'))
  assert.notEqual(hash('q1'), hash('q2'))
  const a = rng(7)
  const b = rng(7)
  assert.equal(a(), b())
})

it('layout is deterministic and spreads islands apart', () => {
  const ids = ['q1', 'q2', 'q3', 'q4']
  const links: Array<[string, string]> = [['q2', 'q1']]
  const a = layout(ids, links)
  const b = layout(ids, links)
  assert.deepEqual([...a], [...b])
  const pts = [...a.values()]
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) > 100, `${i} and ${j} overlap`)
})

it('unconnected islands settle within a few spacings of each other', () => {
  const ids = Array.from({ length: 10 }, (_, i) => `q${i + 1}`)
  const pts = [...layout(ids, []).values()]
  const span = Math.max(...pts.map((p) => Math.hypot(p.x, p.y)))
  assert.ok(span < 1500, `span ${span}`)
})

it('buildWorld maps nodes, edges and proposals to islands, bridges and sandbars', () => {
  const w = buildWorld(snapshot())
  assert.equal(w.islands.length, 11)
  assert.deepEqual(w.bridges, [{ src: 'q2', dst: 'q1', weight: 1, kind: 'requires' }])
  assert.deepEqual(w.trails, [{ a: 'q3', b: 'q4', walks: 1 }])
  assert.equal(w.title, 'Biological credit assignment')
  const q1 = w.islands.find((i) => i.id === 'q1')!
  assert.equal(q1.status, 'solved')
  assert.ok(w.islands.find((i) => i.id === 'q2')!.ready, 'q2 unlocked by solved q1')
  assert.equal(w.islands.find((i) => i.id === 'q11')!.depth, 1)
  assert.equal(w.sandbars.length, 2)
  const near = w.sandbars.find((s) => s.parentId === 'q2')!
  const q2 = w.islands.find((i) => i.id === 'q2')!
  assert.ok(Math.hypot(near.x - q2.x, near.y - q2.y) < 200)
  for (const i of [...w.islands, ...w.sandbars]) assert.ok(Number.isFinite(i.x) && Number.isFinite(i.y))
  for (const i of w.islands) {
    assert.ok(i.x - i.r >= w.bounds.minX && i.x + i.r <= w.bounds.maxX)
    assert.ok(i.y - i.r >= w.bounds.minY && i.y + i.r <= w.bounds.maxY)
  }
})

it('the same snapshot always gives the same world', () => {
  assert.deepEqual(buildWorld(snapshot()), buildWorld(snapshot()))
})
