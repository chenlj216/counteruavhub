import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DATASET_REVIEWED_LABEL,
  getSourceConfidence,
  isEstimatedSource,
} from '../lib/source-confidence.mjs'

test('getSourceConfidence maps official records to high-confidence public-source copy', () => {
  const confidence = getSourceConfidence({
    sourceTier: 'official',
    source: 'DJI Official Specs',
  })

  assert.equal(confidence.label, 'Official / source-monitored')
  assert.equal(confidence.level, 'High')
  assert.match(confidence.note, /manufacturer or monitored public source/i)
})

test('getSourceConfidence maps FCC records to filing-backed copy', () => {
  const confidence = getSourceConfidence({
    sourceTier: 'fcc',
    source: 'FCC ID 2AAKWPF728000',
  })

  assert.equal(confidence.label, 'FCC-backed')
  assert.equal(confidence.level, 'High')
  assert.match(confidence.note, /regulatory filing/i)
})

test('getSourceConfidence maps third-party records to verification-needed copy', () => {
  const confidence = getSourceConfidence({
    sourceTier: 'third-party',
    source: 'Catalog RF Profile',
  })

  assert.equal(confidence.label, 'Public documentation / estimate')
  assert.equal(confidence.level, 'Needs verification')
  assert.match(confidence.note, /verify against official/i)
})

test('isEstimatedSource catches records that should be visibly caveated', () => {
  assert.equal(isEstimatedSource({ sourceTier: 'third-party', source: 'DJI Product Documentation' }), true)
  assert.equal(isEstimatedSource({ sourceTier: 'official', source: 'Catalog RF Profile fallback' }), true)
  assert.equal(isEstimatedSource({ sourceTier: 'official', source: 'DJI Official Specs' }), false)
})

test('DATASET_REVIEWED_LABEL gives UI a stable reviewed-at label', () => {
  assert.equal(DATASET_REVIEWED_LABEL, 'May 2026')
})
