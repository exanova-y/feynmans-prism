import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { startBridge } from '../src/bridge.ts'
import { self } from '../src/state.ts'

const server = startBridge(0)
const base = () => {
  const a = server.address()
  return typeof a === 'object' && a ? `http://127.0.0.1:${a.port}` : ''
}

describe('bridge', () => {
  after(() => server.close())

  it('accepts a pose, rejects junk, and streams it back in the first event', async () => {
    await new Promise((r) => server.once('listening', r))
    self.id = 'ab'.repeat(32)
    self.name = 'Eridanus'
    const bad = await fetch(`${base()}/pose`, { method: 'POST', body: '{"x":1}' })
    assert.equal(bad.status, 400)
    const ok = await fetch(`${base()}/pose`, {
      method: 'POST',
      body: JSON.stringify({ x: 1, y: 2, z: 3, heading: 0.5, form: 'owl' }),
    })
    assert.equal(ok.status, 204)
    assert.equal(ok.headers.get('access-control-allow-origin'), '*')
    const res = await fetch(`${base()}/events`)
    const reader = res.body!.getReader()
    const { value } = await reader.read()
    await reader.cancel()
    const frame = JSON.parse(new TextDecoder().decode(value).replace(/^data: /, ''))
    assert.equal(frame.self.name, 'Eridanus')
    assert.deepEqual(frame.self.pose, { x: 1, y: 2, z: 3, heading: 0.5, form: 'owl' })
    assert.deepEqual(frame.peers, [])
  })
})
