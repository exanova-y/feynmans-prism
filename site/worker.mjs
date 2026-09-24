const MUSIC_KEY = 'greece-sounds.mp3'

function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value ?? '')
  if (!match || (!match[1] && !match[2])) return null
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return false
  return { offset: start, length: end - start + 1 }
}

function musicHeaders(object) {
  return new Headers({
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(object.size),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
    ETag: object.httpEtag,
    'Last-Modified': object.uploaded.toUTCString(),
  })
}

async function music(request, bucket) {
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  const object = await bucket.head(MUSIC_KEY)
  if (!object) return new Response('Music not found', { status: 404 })
  const headers = musicHeaders(object)
  if (request.method === 'HEAD') return new Response(null, { headers })
  const ifRange = request.headers.get('If-Range')
  const useRange = !ifRange || ifRange === object.httpEtag || Date.parse(ifRange) >= object.uploaded.getTime()
  const range = byteRange(useRange ? request.headers.get('Range') : null, object.size)
  if (range === false)
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + object.size } })
  const result = await bucket.get(MUSIC_KEY, { ...(range && { range }), onlyIf: { etagMatches: object.etag } })
  if (!result) return new Response('Music not found', { status: 404 })
  if (!('body' in result)) return new Response('Music changed; retry', { status: 503, headers: { 'Retry-After': '1' } })
  if (range) {
    headers.set('Content-Length', String(range.length))
    headers.set('Content-Range', 'bytes ' + range.offset + '-' + (range.offset + range.length - 1) + '/' + object.size)
  }
  return new Response(result.body, { status: range ? 206 : 200, headers })
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/music/ambience.mp3') return music(request, env.MUSIC)
    return env.ASSETS.fetch(request)
  },
}
