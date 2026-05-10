import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildNewsItem,
  categorizeNews,
  filterRelevantArticles,
  mergeNewsItems,
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
