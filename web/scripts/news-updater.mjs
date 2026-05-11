import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const NEWS_CATEGORIES = ['incident', 'technology', 'regulation', 'military', 'market']

const DEFAULT_QUERY = [
  '("counter-UAS" OR "counter drone" OR "counter-drone" OR "C-UAS" OR "anti-drone" OR "drone detection" OR "drone restriction" OR "unauthorized drone" OR "Remote ID")',
].join(' ')

const DEFAULT_GDELT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc'
const DEFAULT_GDELT_QUERIES = [
  DEFAULT_QUERY,
  '("drone incursion" OR "unauthorized drone" OR "drone sighting") ("airport" OR "critical infrastructure" OR "stadium" OR "prison")',
  '("drone jamming" OR "RF jamming" OR "drone spoofing" OR "GNSS spoofing" OR "Remote ID")',
  '("counter unmanned aerial" OR "UAS mitigation" OR "drone defense" OR "drone warfare")',
]

const DEFAULT_RSS_QUERIES = [
  'counter-UAS OR counter-drone when:2d',
  '"drone detection" OR "unauthorized drone" when:2d',
  '"drone jamming" OR "Remote ID" OR "GNSS spoofing" when:7d',
  '"anti-drone" OR "drone defense" OR "UAS mitigation" when:7d',
]

const SOURCE_BY_DOMAIN = new Map([
  ['faa.gov', 'FAA'],
  ['cisa.gov', 'CISA'],
  ['army.mil', 'U.S. Army'],
  ['defense.gov', 'U.S. Department of Defense'],
  ['droneshield.com', 'DroneShield'],
  ['anduril.com', 'Anduril'],
  ['epirusinc.com', 'Epirus'],
  ['hensoldt.net', 'HENSOLDT'],
  ['dedrone.com', 'Dedrone'],
  ['axon.com', 'AXON'],
  ['breakingdefense.com', 'Breaking Defense'],
  ['defensenews.com', 'Defense News'],
  ['janes.com', 'Janes'],
  ['reuters.com', 'Reuters'],
  ['thedefensepost.com', 'The Defense Post'],
  ['twz.com', 'The War Zone'],
  ['thedrive.com', 'The War Zone'],
  ['uasvision.com', 'UAS Vision'],
])

const RELEVANT_TERMS = [
  'counter-uas',
  'counter uas',
  'counter-uav',
  'counter uav',
  'counter-drone',
  'counter drone',
  'anti-drone',
  'anti drone',
  'drone detection',
  'uas detection',
  'unmanned aircraft system',
  'unauthorized drone',
  'drone incursion',
  'drone restriction',
  'remote id',
  'rf detection',
  'rf jamming',
  'drone jamming',
  'gnss spoofing',
  'jamming',
  'c-uas',
  'cuas',
  'uas mitigation',
  'counter unmanned aerial',
  'drone defense',
  'drone warfare',
  'drone threat',
  'airspace security',
  'critical infrastructure',
]

const CATEGORY_KEYWORDS = {
  incident: ['closed', 'closure', 'incursion', 'sighting', 'unauthorized', 'attack', 'crash', 'near miss'],
  military: ['army', 'navy', 'marine corps', 'air force', 'dod', 'defense department', 'military', 'battlefield'],
  market: ['partnership', 'mou', 'contract', 'acquisition', 'order', 'funding', 'market', 'vendor', 'strategic'],
  regulation: ['rule', 'regulation', 'restriction', 'law', 'policy', 'authorization', 'framework', 'faa', 'cisa'],
  technology: ['detection', 'sensor', 'rf', 'radar', 'jamming', 'spoofing', 'remote id', 'fusion', 'microwave', 'laser'],
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function decodeXmlEntities(value) {
  return normalizeText(value)
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}

export function slugifyId(title, date) {
  const slug = normalizeText(title)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/counter uas/g, 'counter-uas')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .split('-')
    .slice(0, 12)
    .join('-')

  return `${slug}-${date}`.slice(0, 96)
}

export function canonicalizeUrl(url) {
  try {
    const parsed = new URL(url)
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith('utm_') || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key)) {
        parsed.searchParams.delete(key)
      }
    }
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return normalizeText(url).replace(/\/$/, '')
  }
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function sourceFromUrl(url) {
  const host = hostnameFromUrl(url)
  const direct = SOURCE_BY_DOMAIN.get(host)
  if (direct) return direct

  const suffix = [...SOURCE_BY_DOMAIN.keys()].find((domain) => host.endsWith(`.${domain}`))
  return suffix ? SOURCE_BY_DOMAIN.get(suffix) : host || 'Source'
}

function dateFromAny(value) {
  const raw = normalizeText(value)
  if (!raw) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10)
  return dateFromGdelt(raw)
}

function dateFromGdelt(value) {
  const raw = String(value ?? '')
  if (/^\d{14}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return new Date().toISOString().slice(0, 10)
}

export function categorizeNews(title, source = '') {
  const haystack = `${title} ${source}`.toLowerCase()

  if (CATEGORY_KEYWORDS.incident.some((term) => haystack.includes(term))) return 'incident'
  if (CATEGORY_KEYWORDS.technology.some((term) => haystack.includes(term))) return 'technology'
  if (CATEGORY_KEYWORDS.military.some((term) => haystack.includes(term))) return 'military'
  if (CATEGORY_KEYWORDS.market.some((term) => haystack.includes(term))) return 'market'
  if (CATEGORY_KEYWORDS.regulation.some((term) => haystack.includes(term))) return 'regulation'

  return 'technology'
}

export function filterRelevantArticles(articles) {
  return articles.filter((article) => {
    const haystack = `${article.title ?? ''} ${article.source ?? ''} ${article.url ?? ''}`.toLowerCase()
    return RELEVANT_TERMS.some((term) => haystack.includes(term))
  })
}

function excerptTopic(title) {
  const lower = title.toLowerCase()
  if (lower.includes('restriction') || lower.includes('rule') || lower.includes('policy')) return 'drone policy and airspace security'
  if (lower.includes('detection') || lower.includes('sensor') || lower.includes('radar')) return 'drone detection and tracking'
  if (lower.includes('jamming') || lower.includes('rf')) return 'RF countermeasure planning'
  if (lower.includes('contract') || lower.includes('partnership') || lower.includes('mou')) return 'counter-UAS market activity'
  if (lower.includes('remote id')) return 'Remote ID and drone identification'
  return 'counter-UAS operations'
}

export function buildNewsItem(article) {
  const title = normalizeText(article.title)
  const source = normalizeText(article.source) || sourceFromUrl(article.url)
  const date = normalizeText(article.date) || new Date().toISOString().slice(0, 10)
  const url = canonicalizeUrl(article.url)
  const category = categorizeNews(title, source)
  const topic = excerptTopic(title)

  return {
    id: slugifyId(title, date),
    title,
    source,
    date,
    excerpt: `${source} reported a development involving ${topic}. CounterUAVHub tracks it as a counter-UAS lead for security, regulation, and defense technology monitoring.`,
    url,
    category,
  }
}

export function mergeNewsItems(existing, incoming, limit = 80) {
  const seen = new Set()
  const output = [...existing]

  for (const item of existing) {
    seen.add(canonicalizeUrl(item.url))
  }

  for (const item of incoming) {
    const key = canonicalizeUrl(item.url)
    if (seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }

  return output.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

export function normalizeGdeltArticle(article) {
  const url = article.url || article.url_mobile || ''
  return {
    title: normalizeText(article.title),
    url,
    source: normalizeText(article.sourceCommonName) || sourceFromUrl(url),
    date: dateFromGdelt(article.seendate || article.date),
  }
}

function googleNewsRssUrl(query) {
  const url = new URL('https://news.google.com/rss/search')
  url.searchParams.set('q', query)
  url.searchParams.set('hl', 'en-US')
  url.searchParams.set('gl', 'US')
  url.searchParams.set('ceid', 'US:en')
  return url.toString()
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeXmlEntities(match[1]) : ''
}

export function parseRssItems(xml) {
  const itemBlocks = [...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0])

  return itemBlocks.map((block) => {
    const link = extractTag(block, 'link')
    const source = extractTag(block, 'source') || sourceFromUrl(link)
    return {
      title: extractTag(block, 'title'),
      url: link,
      source,
      date: dateFromAny(extractTag(block, 'pubDate')),
    }
  }).filter((item) => item.title && item.url)
}

export async function fetchGoogleNewsRssArticles({
  query,
  url,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!fetchImpl) {
    throw new Error('This Node.js runtime does not provide fetch.')
  }

  const response = await fetchImpl(url || googleNewsRssUrl(query))
  if (!response.ok) {
    throw new Error(`Google News RSS request failed: ${response.status} ${response.statusText}`)
  }

  return parseRssItems(await response.text())
}

export async function fetchGdeltArticles({
  query = DEFAULT_QUERY,
  endpoint = DEFAULT_GDELT_ENDPOINT,
  maxRecords = 50,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!fetchImpl) {
    throw new Error('This Node.js runtime does not provide fetch.')
  }

  const url = new URL(endpoint)
  url.searchParams.set('query', query)
  url.searchParams.set('mode', 'artlist')
  url.searchParams.set('format', 'json')
  url.searchParams.set('maxrecords', String(maxRecords))
  url.searchParams.set('sort', 'datedesc')

  const response = await fetchImpl(url)
  if (!response.ok) {
    throw new Error(`GDELT request failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  return Array.isArray(payload.articles) ? payload.articles.map(normalizeGdeltArticle) : []
}

export function defaultNewsSources() {
  const sources = DEFAULT_GDELT_QUERIES.map((query, index) => ({
    name: `gdelt-${index + 1}`,
    fetchArticles: () => fetchGdeltArticles({ query, maxRecords: 30 }),
  }))

  for (const [index, query] of DEFAULT_RSS_QUERIES.entries()) {
    sources.push({
      name: `google-news-rss-${index + 1}`,
      fetchArticles: () => fetchGoogleNewsRssArticles({ query }),
    })
  }

  return sources
}

export async function fetchAllNewsArticles({ sources = defaultNewsSources() } = {}) {
  const articles = []
  const failures = []
  let successCount = 0

  for (const source of sources) {
    try {
      const result = await source.fetchArticles()
      successCount += 1
      articles.push(...result)
      console.log(`News source ${source.name}: ${result.length} article(s)`)
    } catch (error) {
      failures.push(`${source.name}: ${error.message}`)
      console.warn(`News source ${source.name} failed: ${error.message}`)
    }
  }

  if (successCount === 0) {
    throw new Error(`All news sources failed. ${failures.join(' | ')}`)
  }

  if (failures.length) {
    console.warn(`News update continued with ${failures.length} failed source(s).`)
  }

  return articles
}

export async function updateNewsData({
  existingItems,
  fetchArticles = fetchAllNewsArticles,
  allowFetchFailure = false,
  maxNew = 8,
  limit = 80,
} = {}) {
  let articles
  try {
    articles = await fetchArticles()
  } catch (error) {
    if (!allowFetchFailure) throw error
    console.warn(`News fetch failed; keeping existing data. ${error.message}`)
    return existingItems
  }

  const incoming = filterRelevantArticles(articles)
    .slice(0, maxNew)
    .map(buildNewsItem)

  return mergeNewsItems(existingItems, incoming, limit)
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

export function defaultNewsJsonPath() {
  const currentFile = fileURLToPath(import.meta.url)
  return path.resolve(path.dirname(currentFile), '..', 'data', 'news.json')
}
