import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildNewsItem,
  categorizeNews,
  fetchAllNewsArticles,
  fetchGoogleNewsRssArticles,
  filterRelevantArticles,
  mergeNewsItems,
  parseRssItems,
  slugifyId,
  updateNewsData,
} from './news-updater.mjs'

test('filters articles to counter-UAS relevant leads', () => {
  const articles = [
    { title: 'FAA expands drone detection testing near airports', url: 'https://www.faa.gov/a', source: 'FAA', date: '2026-05-09' },
    { title: 'Consumer drone camera firmware update released', url: 'https://example.com/b', source: 'Example', date: '2026-05-09' },
    { title: 'Critical infrastructure operators review counter-UAS policy', url: 'https://www.cisa.gov/c', source: 'CISA', date: '2026-05-09' },
  ]

  const filtered = filterRelevantArticles(articles)

  assert.deepEqual(filtered.map((item) => item.url), ['https://www.faa.gov/a', 'https://www.cisa.gov/c'])
})

test('categorizes regulation, military, market, incident, and technology items', () => {
  assert.equal(categorizeNews('FAA proposes new drone restriction rule', 'FAA'), 'regulation')
  assert.equal(categorizeNews('Army awards counter-UAS contract', 'U.S. Army'), 'military')
  assert.equal(categorizeNews('Vendor announces strategic counter-drone partnership', 'DroneShield'), 'market')
  assert.equal(categorizeNews('Airport runway closed after drone sighting', 'Local News'), 'incident')
  assert.equal(categorizeNews('RF detection sensor fusion improves drone tracking', 'Research Lab'), 'technology')
})

test('builds stable ids and conservative excerpts from article metadata', () => {
  const item = buildNewsItem({
    title: 'FAA tests counter-UAS detection near critical infrastructure',
    url: 'https://www.faa.gov/newsroom/test',
    source: 'FAA',
    date: '2026-05-09',
  })

  assert.equal(item.id, 'faa-tests-counter-uas-detection-near-critical-infrastructure-2026-05-09')
  assert.equal(item.category, 'technology')
  assert.match(item.excerpt, /FAA/)
  assert.match(item.excerpt, /counter-UAS/)
})

test('merges new items ahead of existing items and deduplicates by canonical url', () => {
  const existing = [
    {
      id: 'existing',
      title: 'Existing item',
      source: 'FAA',
      date: '2026-05-01',
      excerpt: 'Existing excerpt.',
      url: 'https://www.faa.gov/newsroom/item?utm_source=x',
      category: 'regulation',
    },
  ]
  const incoming = [
    {
      id: 'incoming-duplicate',
      title: 'Incoming duplicate',
      source: 'FAA',
      date: '2026-05-10',
      excerpt: 'Incoming excerpt.',
      url: 'https://www.faa.gov/newsroom/item',
      category: 'regulation',
    },
    {
      id: 'incoming-new',
      title: 'Incoming new',
      source: 'CISA',
      date: '2026-05-09',
      excerpt: 'Incoming new excerpt.',
      url: 'https://www.cisa.gov/news/new',
      category: 'regulation',
    },
  ]

  const merged = mergeNewsItems(existing, incoming, 10)

  assert.deepEqual(merged.map((item) => item.id), ['incoming-new', 'existing'])
})

test('slugifyId keeps ids deterministic and compact', () => {
  assert.equal(slugifyId('DroneShield & Terma sign C-UAS MOU!', '2026-05-04'), 'droneshield-terma-sign-c-uas-mou-2026-05-04')
})

test('keeps existing data when fetch fails and fallback is enabled', async () => {
  const existing = [
    {
      id: 'existing',
      title: 'Existing item',
      source: 'FAA',
      date: '2026-05-01',
      excerpt: 'Existing excerpt.',
      url: 'https://www.faa.gov/newsroom/item',
      category: 'regulation',
    },
  ]

  const updated = await updateNewsData({
    existingItems: existing,
    allowFetchFailure: true,
    fetchArticles: async () => {
      throw new Error('network down')
    },
  })

  assert.deepEqual(updated, existing)
})

test('parseRssItems reads Google News-style RSS items with source and date', () => {
  const xml = `<?xml version="1.0"?>
    <rss><channel>
      <item>
        <title>Airport deploys counter-drone detection system</title>
        <link>https://news.google.com/rss/articles/example</link>
        <pubDate>Mon, 11 May 2026 03:30:00 GMT</pubDate>
        <source url="https://example.com">Example Aviation</source>
      </item>
    </channel></rss>`

  const items = parseRssItems(xml)

  assert.equal(items.length, 1)
  assert.equal(items[0].title, 'Airport deploys counter-drone detection system')
  assert.equal(items[0].source, 'Example Aviation')
  assert.equal(items[0].date, '2026-05-11')
})

test('fetchGoogleNewsRssArticles builds article records from RSS text', async () => {
  const articles = await fetchGoogleNewsRssArticles({
    url: 'https://news.google.com/rss/search?q=counter-UAS',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => `<rss><channel><item><title>C-UAS market expands</title><link>https://example.com/cuas</link><pubDate>Mon, 11 May 2026 01:00:00 GMT</pubDate><source>Defense Daily</source></item></channel></rss>`,
    }),
  })

  assert.deepEqual(articles, [
    {
      title: 'C-UAS market expands',
      url: 'https://example.com/cuas',
      source: 'Defense Daily',
      date: '2026-05-11',
    },
  ])
})

test('fetchAllNewsArticles combines successful sources and ignores one failed source', async () => {
  const articles = await fetchAllNewsArticles({
    sources: [
      {
        name: 'bad',
        fetchArticles: async () => {
          throw new Error('source down')
        },
      },
      {
        name: 'good',
        fetchArticles: async () => [
          { title: 'Counter-UAS testing expands', url: 'https://example.com/a', source: 'Example', date: '2026-05-11' },
        ],
      },
    ],
  })

  assert.equal(articles.length, 1)
  assert.equal(articles[0].title, 'Counter-UAS testing expands')
})

test('fetchAllNewsArticles throws when every source fails', async () => {
  await assert.rejects(
    () => fetchAllNewsArticles({
      sources: [
        {
          name: 'bad',
          fetchArticles: async () => {
            throw new Error('source down')
          },
        },
      ],
    }),
    /All news sources failed/
  )
})
