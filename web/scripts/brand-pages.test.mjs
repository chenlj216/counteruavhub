import test from 'node:test'
import assert from 'node:assert/strict'

import {
  filterDronesForBrand,
  getBrandFromSlug,
  getBrandSlug,
  summarizeBrandDrones,
} from '../lib/brand-pages.mjs'

const sampleDrones = [
  {
    id: 'dji-mini',
    name: 'DJI Mini',
    brand: 'DJI',
    category: 'consumer',
    controlFreq: '2.4GHz / 5.8GHz',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS L1',
    sourceTier: 'official',
  },
  {
    id: 'dji-matrice',
    name: 'DJI Matrice',
    brand: 'DJI',
    category: 'industrial',
    controlFreq: '2.4GHz / 5.8GHz',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS L1/L2',
    sourceTier: 'third-party',
  },
  {
    id: 'parrot-anafi',
    name: 'Parrot ANAFI',
    brand: 'Parrot',
    category: 'consumer',
    controlFreq: '2.4GHz',
    videoFreq: '2.4GHz',
    gpsFreq: 'GPS L1',
    sourceTier: 'fcc',
  },
]

test('getBrandSlug creates stable SEO slugs', () => {
  assert.equal(getBrandSlug('DJI'), 'dji')
  assert.equal(getBrandSlug('FPV Protocol'), 'fpv-protocol')
  assert.equal(getBrandSlug('Quantum-Systems'), 'quantum-systems')
})

test('getBrandFromSlug resolves known brands from drone data', () => {
  assert.equal(getBrandFromSlug(sampleDrones, 'dji'), 'DJI')
  assert.equal(getBrandFromSlug(sampleDrones, 'parrot'), 'Parrot')
  assert.equal(getBrandFromSlug(sampleDrones, 'missing'), null)
})

test('filterDronesForBrand returns only matching brand records', () => {
  assert.deepEqual(
    filterDronesForBrand(sampleDrones, 'dji').map((drone) => drone.id),
    ['dji-mini', 'dji-matrice']
  )
})

test('summarizeBrandDrones produces category and source confidence counts', () => {
  const summary = summarizeBrandDrones(filterDronesForBrand(sampleDrones, 'dji'))

  assert.equal(summary.total, 2)
  assert.deepEqual(summary.categories, [
    { label: 'Consumer', count: 1 },
    { label: 'Industrial', count: 1 },
  ])
  assert.deepEqual(summary.sourceConfidence, [
    { label: 'Official / source-monitored', count: 1 },
    { label: 'Public documentation / estimate', count: 1 },
  ])
})
