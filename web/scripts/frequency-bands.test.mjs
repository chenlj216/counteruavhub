import test from 'node:test'
import assert from 'node:assert/strict'

import {
  FREQUENCY_BANDS,
  filterDronesForBand,
  getFrequencyBand,
  summarizeBandDrones,
} from '../lib/frequency-bands.mjs'

const sampleDrones = [
  {
    id: 'dji-o4',
    name: 'DJI O4 Drone',
    brand: 'DJI',
    category: 'consumer',
    controlFreq: '2.4GHz / 5.8GHz',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS L1',
    controlFreqMHz: [2400, 5800],
  },
  {
    id: 'fpv-58',
    name: 'Analog FPV',
    brand: 'FPV',
    category: 'fpv',
    controlFreq: '900MHz',
    videoFreq: '5.8GHz',
    gpsFreq: 'None',
    controlFreqMHz: [915],
  },
  {
    id: 'rtk-gnss',
    name: 'RTK Mapping Drone',
    brand: 'MappingCo',
    category: 'industrial',
    controlFreq: '900MHz',
    videoFreq: 'LTE',
    gpsFreq: 'GPS L1/L2, Galileo E1, BeiDou B1',
    controlFreqMHz: [915],
  },
]

test('FREQUENCY_BANDS defines the first SEO landing-page set', () => {
  assert.deepEqual(
    FREQUENCY_BANDS.map((band) => band.slug),
    ['2-4ghz', '5-8ghz', 'gnss']
  )
})

test('getFrequencyBand returns band metadata by slug', () => {
  const band = getFrequencyBand('2-4ghz')
  assert.equal(band.label, '2.4GHz Drone Frequencies')
  assert.match(band.description, /control links/i)
})

test('filterDronesForBand matches RF text fields and numeric control frequencies', () => {
  assert.deepEqual(
    filterDronesForBand(sampleDrones, '2-4ghz').map((drone) => drone.id),
    ['dji-o4']
  )
  assert.deepEqual(
    filterDronesForBand(sampleDrones, '5-8ghz').map((drone) => drone.id),
    ['dji-o4', 'fpv-58']
  )
  assert.deepEqual(
    filterDronesForBand(sampleDrones, 'gnss').map((drone) => drone.id),
    ['dji-o4', 'rtk-gnss']
  )
})

test('summarizeBandDrones produces counts for page copy and internal links', () => {
  const summary = summarizeBandDrones(filterDronesForBand(sampleDrones, '5-8ghz'))

  assert.equal(summary.total, 2)
  assert.deepEqual(summary.categories, [
    { label: 'Consumer', count: 1 },
    { label: 'FPV', count: 1 },
  ])
  assert.deepEqual(summary.topBrands, [
    { label: 'DJI', count: 1 },
    { label: 'FPV', count: 1 },
  ])
})
