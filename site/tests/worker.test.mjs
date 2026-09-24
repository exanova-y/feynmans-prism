import assert from 'node:assert/strict'
import test from 'node:test'
import worker from '../worker.mjs'

const metadata = { size: 10, etag: 'track', httpEtag: '"track"', uploaded: new Date('2026-09-18') }

function fixture() {
  const calls = []
  const env = {
    MUSIC: {
      async head(key) { calls.push(['head', key]); return metadata },
      async get(key, options) {
        calls.push(['get', key, options])
        const range = options.range ?? { offset: 0, length: 10 }
        return { ...metadata, body: '0123456789'.slice(range.offset, range.offset + range.length) }
      },
    },
    ASSETS: { async fetch() { return new Response('static asset') } },
  }
  const request = (headers = {}, method = 'GET') =>
    worker.fetch(new Request('https://example.com/music/ambience.mp3', { headers, method }), env)
  return { env, calls, request }
}

test('serves full audio and supports closed, open-ended, suffix, and clipped byte ranges', async () => {
  for (const [range, body, contentRange] of [
    [undefined, '0123456789', null],
    ['bytes=2-4', '234', 'bytes 2-4/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
    ['bytes=8-99', '89', 'bytes 8-9/10'],
  ]) {
    const { request, calls } = fixture()
    const response = await request(range ? { Range: range } : {})
    assert.equal(response.status, range ? 206 : 200)
    assert.equal(response.headers.get('Content-Type'), 'audio/mpeg')
    assert.equal(response.headers.get('Content-Range'), contentRange)
    assert.equal(response.headers.get('Content-Length'), String(body.length))
    assert.equal(await response.text(), body)
    assert.equal(calls[1][1], 'greece-sounds.mp3')
  }
})

test('rejects unsatisfiable ranges without reading the object body', async () => {
  for (const range of ['bytes=10-', 'bytes=4-2', 'bytes=-0']) {
    const { request, calls } = fixture()
    const response = await request({ Range: range })
    assert.equal(response.status, 416)
    assert.equal(response.headers.get('Content-Range'), 'bytes */10')
    assert.equal(calls.length, 1)
  }
})

test('HEAD returns metadata without reading the body', async () => {
  const { request, calls } = fixture()
  const response = await request({ Range: 'bytes=2-4' }, 'HEAD')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Length'), '10')
  assert.equal(await response.text(), '')
  assert.equal(calls.length, 1)
})

test('a stale If-Range returns the full current track', async () => {
  const response = await fixture().request({ Range: 'bytes=2-4', 'If-Range': '"old"' })
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '0123456789')
})

test('missing tracks, concurrent replacements and unsupported methods return explicit errors', async () => {
  const { request, env, calls } = fixture()
  assert.equal((await request({}, 'POST')).status, 405)
  assert.equal(calls.length, 0)
  env.MUSIC.get = async () => metadata
  assert.equal((await request()).status, 503)
  env.MUSIC.head = async () => null
  assert.equal((await request()).status, 404)
})

test('other paths use static assets and cannot read arbitrary bucket keys', async () => {
  const { env, calls } = fixture()
  const response = await worker.fetch(new Request('https://example.com/music/private.mp3'), env)
  assert.equal(await response.text(), 'static asset')
  assert.equal(calls.length, 0)
})
