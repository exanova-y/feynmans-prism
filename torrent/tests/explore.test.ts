import assert from 'node:assert/strict'
import { it } from 'node:test'
import { explore, exploreQuery, normalizeTitle, proposalsFrom, type Paper } from '../src/explore.ts'

const anchors = [
  {
    id: 'q1',
    text: 'Can weight mirroring strategies be extended to convolutional architectures?',
    weight: 1,
  },
  {
    id: 'q2',
    text: 'Which sparse configurations represent genuine research gaps versus artifacts?',
    weight: 0.5,
  },
]

it('exploreQuery keeps content words, weighted by anchor', () => {
  const q = exploreQuery(anchors, 4).split(' ')
  assert.equal(q.length, 4)
  assert.ok(q.includes('weight') || q.includes('mirroring'))
  assert.ok(!q.includes('which') && !q.includes('versus'))
  assert.equal(exploreQuery([{ id: 'x', text: 'the and', weight: 1 }]), '')
  const repeated = [{ id: 'y', text: 'bound the angles, relax that bound; hemispherical arrays', weight: 1 }]
  assert.equal(exploreQuery(repeated, 1), 'hemispherical')
})

it('proposalsFrom skips known and duplicate titles', () => {
  const papers: Paper[] = [
    { key: 'a', title: 'Weight Mirroring in ConvNets', year: 2021, url: 'https://doi.org/a' },
    { key: 'b', title: 'weight mirroring in convnets!', year: 2022, url: 'https://doi.org/b' },
    { key: 'c', title: 'Already On The Map', year: null, url: 'https://doi.org/c' },
    { key: 'd', title: 'Something New', year: 2020, url: 'https://doi.org/d' },
  ]
  const known = new Set([normalizeTitle('Already on the map')])
  assert.deepEqual(proposalsFrom(papers, known), [
    '[2021] Weight Mirroring in ConvNets (https://doi.org/a)',
    '[2020] Something New (https://doi.org/d)',
  ])
})

it('explore shortens the query until the search returns something', async () => {
  const calls: string[] = []
  const search = async (q: string, limit: number) => {
    calls.push(`${q}|${limit}`)
    return calls.length < 3 ? [] : [{ key: 'z', title: 'Found', year: 2024, url: 'u' }]
  }
  const r = await explore(anchors, new Set(), search, 3, 'Transducer placement for 360° brain coverage')
  assert.equal(calls.length, 3)
  assert.ok(calls[0].startsWith('transducer placement coverage '), calls[0])
  assert.equal(calls[0].split('|')[0].split(' ').length, 6)
  assert.equal(calls[2].split('|')[0].split(' ').length, 4)
  assert.ok(calls[0].endsWith('|3'))
  assert.deepEqual(r.proposals, ['[2024] Found (u)'])
  assert.equal(r.query, calls[2].split('|')[0])
})

it('explore gives up quietly when nothing matches', async () => {
  const r = await explore(anchors, new Set(), async () => [], 3, 'x')
  assert.deepEqual(r, { query: '', proposals: [] })
})
