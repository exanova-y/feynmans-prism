import assert from 'node:assert/strict'
import { after, before, it } from 'node:test'
import { startBridge } from '../src/bridge.ts'
import { PROBLEMS } from '../src/data.ts'
import { Graph } from '../src/graph.ts'
import { graphVersion, self, setGraph } from '../src/state.ts'
import { openGraph } from '../src/restructure.ts'

const server = startBridge(0)
const base = () => {
  const a = server.address()
  return typeof a === 'object' && a ? `http://127.0.0.1:${a.port}` : ''
}

before(() => {
  openGraph(':memory:')
  return new Promise((r) => server.once('listening', r))
})
after(() => server.close())

it('serves a world once a graph snapshot is known', async () => {
  assert.equal((await fetch(`${base()}/world?problem=credit-assignment`)).status, 404)
  const g = new Graph()
  g.seed(PROBLEMS)
  const version = graphVersion.n
  setGraph(g.snapshot('credit-assignment'))
  g.close()
  assert.equal(graphVersion.n, version + 1)
  const res = await fetch(`${base()}/world?problem=credit-assignment`)
  assert.equal(res.status, 200)
  const w = (await res.json()) as { islands: Array<{ x: number }>; title: string }
  assert.equal(w.islands.length, 10)
  assert.equal(w.title, 'Biological credit assignment')
  assert.ok(w.islands.every((i) => Number.isFinite(i.x)))
})

it('streams worlds on the research event stream', async () => {
  const res = await fetch(`${base()}/research`)
  const reader = res.body!.getReader()
  const { value } = await reader.read()
  await reader.cancel()
  const text = new TextDecoder().decode(value)
  assert.ok(text.startsWith('event: world\ndata: '), text.slice(0, 40))
  assert.equal(JSON.parse(text.split('\n')[1].slice(6)).problemId, 'credit-assignment')
})

it('walk validates, then counts on the coordinator', async () => {
  self.coordinator = true
  self.home = ''
  const post = (body: string) => fetch(`${base()}/walk`, { method: 'POST', body })
  assert.equal((await post('{"problemId":"credit-assignment","a":"q1","b":"q1"}')).status, 400)
  assert.equal((await post('{"problemId":"credit-assignment","a":"q1","b":"nope"}')).status, 400)
  for (let i = 0; i < 3; i++)
    assert.equal((await post('{"problemId":"credit-assignment","a":"q1","b":"q2"}')).status, 204)
  const w = (await (await fetch(`${base()}/world?problem=credit-assignment`)).json()) as {
    trails: Array<{ walks: number }>
    bridges: Array<{ kind: string }>
  }
  assert.deepEqual(w.trails, [{ a: 'q1', b: 'q2', walks: 3 }])
  assert.equal(w.bridges[0]?.kind, 'road')
})

it('explore rejects unknown problems and empty anchors', async () => {
  const post = (body: string) => fetch(`${base()}/explore`, { method: 'POST', body })
  assert.equal((await post('nope')).status, 400)
  assert.equal((await post('{"problemId":"x"}')).status, 404)
  assert.equal(
    (await post('{"problemId":"credit-assignment","anchors":[{"id":"zz","weight":1}]}')).status,
    400,
  )
})
