import assert from 'node:assert/strict'
import test from 'node:test'

import { buildBlogAutomationContext, slugifyTopic } from './blog-context-builder.mjs'
import { validateDraftMarkdown } from './blog-draft-validator.mjs'

const existingPosts = [
  {
    slug: 'radar-vs-rf-drone-detection',
    title: 'Radar vs RF Drone Detection',
    date: '2026-05-01',
    excerpt: 'Existing comparison article.',
    keywords: 'radar, rf detection',
  },
]

const newsItems = [
  {
    title: 'Airport expands Remote ID and RF drone detection testing',
    source: 'FAA',
    date: '2026-05-24',
    category: 'technology',
    excerpt: 'Counter-UAS teams are testing detection layers.',
    url: 'https://example.com/remote-id-rf',
  },
]

test('slugifyTopic creates stable lowercase blog slugs', () => {
  assert.equal(slugifyTopic('900 MHz Drone Control Links & Counter-UAS Monitoring'), '900-mhz-drone-control-links-counter-uas-monitoring')
})

test('buildBlogAutomationContext proposes non-duplicate technical topics', () => {
  const context = buildBlogAutomationContext({
    existingPosts,
    newsItems,
    drones: [{ id: 'dji-mavic-3', brand: 'DJI', category: 'consumer', controlFreq: '2.4GHz / 5.8GHz' }],
    now: new Date('2026-05-25T00:00:00Z'),
  })

  assert.equal(context.generatedDate, '2026-05-25')
  assert.ok(context.candidates.length >= 3)
  assert.ok(context.candidates.some((candidate) => candidate.slug.includes('remote-id')))
  assert.ok(context.candidates.every((candidate) => candidate.slug !== 'radar-vs-rf-drone-detection'))
  assert.ok(context.requiredInternalLinks.includes('/tools/drone-frequency-database'))
})

test('validateDraftMarkdown rejects unsafe operational detail', () => {
  const draft = `---
title: "Unsafe Counter-UAS Draft"
date: "2026-05-25"
excerpt: "A draft with unsafe operational content."
keywords: "counter uas, drone jamming"
---

This article tells readers how to build a drone jammer and set jammer power to defeat a target link.

Read the [Drone Signal Database](/tools/drone-frequency-database).
`

  const result = validateDraftMarkdown(draft, {
    slug: 'unsafe-counter-uas-draft',
    existingSlugs: [],
    minWordCount: 10,
  })

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('unsafe operational pattern')))
})

test('validateDraftMarkdown accepts safe counter-UAS educational draft', () => {
  const draft = `---
title: "Remote ID and RF Detection for Site Security"
date: "2026-05-25"
excerpt: "A practical, defensive overview of how Remote ID and RF detection support authorized counter-UAS site security planning."
keywords: "remote id, rf detection, counter uas"
---

Remote ID and RF detection solve different parts of the site-security problem. Remote ID helps teams identify cooperative aircraft, while RF detection helps them understand signal activity around a protected site. Used together, they give security teams a better starting point for triage without replacing visual confirmation, policy checks, or lawful response procedures.

For model-level signal references, start with the [Drone Signal Database](/tools/drone-frequency-database). For sensor trade-offs, compare this article with [Radar vs RF Drone Detection](/blog/radar-vs-rf-drone-detection).
`

  const result = validateDraftMarkdown(draft, {
    slug: 'remote-id-and-rf-detection-for-site-security',
    existingSlugs: ['radar-vs-rf-drone-detection'],
    minWordCount: 45,
  })

  assert.deepEqual(result.errors, [])
  assert.equal(result.valid, true)
  assert.ok(result.internalLinks.includes('/tools/drone-frequency-database'))
})
