// Stepping off the map. Where the player left the map is a query: the
// islands nearest that point, weighted by distance, give the keywords; a
// paper search turns them into candidate land. Candidates come back as
// proposal texts for the coordinator's queue — sandbars until reviewed.
//
// OpenAlex is the search (free, no key; Semantic Scholar rate-limits
// unauthenticated calls too hard). `Search` is injectable for tests.

export interface Anchor {
  id: string
  text: string
  weight: number
}

export interface Paper {
  key: string
  title: string
  year: number | null
  url: string
}

export type Search = (query: string, limit: number) => Promise<Paper[]>

const STOP = new Set(
  (
    'the and for with that this from what which their there these those than then into onto over under between ' +
    'beyond about above below while where when how can could would should does do did are was were been being ' +
    'have has had not but or nor its such more most less least very also both each other some any all only ' +
    'within without across through during versus toward towards represent represents given rather whether ' +
    'every fewest give gives change answer usable adequate stand rank compared versus much many'
  ).split(' '),
)

export const normalizeTitle = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Top keywords across the anchors, each anchor's words scored by its weight.
export function exploreQuery(anchors: Anchor[], max = 8): string {
  const score = new Map<string, number>()
  for (const a of anchors) {
    // Presence, not frequency: a word repeated inside one anchor is not
    // more specific for it ("bound … bound" once outranked "hemispherical").
    const words = new Set(a.text.toLowerCase().split(/[^a-z0-9-]+/))
    for (const w of words) {
      if (w.length < 4 || STOP.has(w)) continue
      score.set(w, (score.get(w) ?? 0) + a.weight)
    }
  }
  // Ties: longer words first, as a cheap proxy for specificity.
  return [...score.entries()]
    .toSorted((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([w]) => w)
    .join(' ')
}

// Proposal text per paper not already on the map. `known` holds normalized
// titles of every node and pending proposal, so a re-found paper becomes a
// road later rather than a second island now.
export function proposalsFrom(papers: Paper[], known: Set<string>): string[] {
  const out: string[] = []
  const seen = new Set(known)
  for (const p of papers) {
    const key = normalizeTitle(p.title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(`${p.year ? `[${p.year}] ` : ''}${p.title} (${p.url})`)
  }
  return out
}

interface OpenAlexWork {
  id: string
  title: string | null
  publication_year: number | null
  doi: string | null
}

// Title-and-abstract filter: it ANDs every term, so four or five specific
// words find a tight set and eight find none. `explore` shortens the query
// until something comes back.
export const openAlexSearch: Search = async (query, limit) => {
  const mailto = process.env.OPENALEX_MAILTO ?? ''
  const url =
    `https://api.openalex.org/works?filter=title_and_abstract.search:${encodeURIComponent(query)}` +
    `&per-page=${limit}&select=id,title,publication_year,doi${mailto ? `&mailto=${encodeURIComponent(mailto)}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`openalex ${res.status}`)
  const body = (await res.json()) as { results: OpenAlexWork[] }
  return body.results
    .filter((w) => w.title)
    .map((w) => ({ key: w.id, title: w.title as string, year: w.publication_year, url: w.doi ?? w.id }))
}

// Queries to try, most specific first: domain words from the problem title
// keep the search in the field; anchor words say where on the map we are.
export function exploreQueries(anchors: Anchor[], domain: string): string[] {
  const dom = (n: number) => exploreQuery([{ id: 'domain', text: domain, weight: 1 }], n)
  const shapes: Array<[number, number]> = [
    [3, 3],
    [3, 2],
    [2, 2],
    [2, 1],
  ]
  const out: string[] = []
  for (const [d, a] of shapes) {
    const q = [dom(d), exploreQuery(anchors, a)].filter(Boolean).join(' ')
    if (q && !out.includes(q)) out.push(q)
  }
  return out
}

export async function explore(
  anchors: Anchor[],
  known: Set<string>,
  search = openAlexSearch,
  limit = 6,
  domain = '',
) {
  for (const query of exploreQueries(anchors, domain)) {
    const papers = await search(query, limit)
    if (papers.length) return { query, proposals: proposalsFrom(papers, known) }
  }
  return { query: '', proposals: [] as string[] }
}
