import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDroneRecordFromCatalogEntry,
  buildCandidatesFromCatalog,
  extractSignalHints,
  mergeDroneRecords,
  slugifyDroneId,
} from './drone-updater.mjs'

test('slugifyDroneId creates stable model ids', () => {
  assert.equal(slugifyDroneId('Quantum-Systems', 'Vector AI'), 'quantum-systems-vector-ai')
  assert.equal(slugifyDroneId('DJI', 'Mavic 3 Enterprise'), 'dji-mavic-3-enterprise')
})

test('extractSignalHints detects common control/video bands and transmission protocols', () => {
  const text = `
    Operating Frequency 2.4000-2.4835 GHz, 5.725-5.850 GHz.
    Video Transmission: DJI O3 Enterprise Transmission.
    GNSS: GPS + Galileo + BeiDou.
    Transmitter Power EIRP 33 dBm (FCC).
  `

  const hints = extractSignalHints(text)

  assert.deepEqual(hints.controlFreqMHz, [2400, 5800])
  assert.equal(hints.controlFreq, '2.4GHz / 5.8GHz')
  assert.equal(hints.videoProtocol, 'O3 Enterprise')
  assert.equal(hints.gpsFreq, 'GPS + Galileo + BeiDou')
  assert.equal(hints.gcsTxPowerDbm, 33)
})

test('buildDroneRecordFromCatalogEntry fills complete records from RF profiles', () => {
  const record = buildDroneRecordFromCatalogEntry({
    brand: 'Autel',
    name: 'EVO Max 4T',
    category: 'industrial',
    rfProfile: 'autel-skylink-24-58',
    sourceUrl: 'https://www.autelrobotics.com/evo-max-4t',
  })

  assert.equal(record.id, 'autel-evo-max-4t')
  assert.equal(record.videoProtocol, 'Autel SkyLink')
  assert.deepEqual(record.controlFreqMHz, [2400, 5800])
  assert.equal(record.sourceTier, 'official')
})

test('mergeDroneRecords adds new records without replacing official existing data with lower confidence candidates', () => {
  const existing = [
    {
      id: 'dji-mavic-3-pro',
      name: 'DJI Mavic 3 Pro',
      brand: 'DJI',
      category: 'consumer',
      controlFreq: '2.4GHz / 5.8GHz',
      videoProtocol: 'O3+',
      videoFreq: '2.4GHz / 5.8GHz',
      gpsFreq: 'GPS L1, GLONASS F1, BeiDou B1, Galileo E1',
      maxTxPower: '26 dBm (2.4GHz) / 26 dBm (5.8GHz)',
      counterFreq: '2.4GHz, 5.8GHz',
      source: 'DJI Official Specs',
      sourceTier: 'official',
      sourceUrl: 'https://www.dji.com/mavic-3-pro/specs',
      controlFreqMHz: [2400, 5800],
      gcsTxPowerDbm: 26,
      controlChannelBW_MHz: 2,
    },
  ]

  const incoming = [
    {
      ...existing[0],
      source: 'Catalog estimate',
      sourceTier: 'third-party',
      maxTxPower: 'Unknown',
    },
    buildDroneRecordFromCatalogEntry({
      brand: 'Skydio',
      name: 'X10',
      category: 'industrial',
      rfProfile: 'skydio-enterprise-24-58',
      sourceUrl: 'https://www.skydio.com/x10',
    }),
  ]

  const merged = mergeDroneRecords(existing, incoming)

  assert.equal(merged.length, 2)
  assert.equal(merged.find((item) => item.id === 'dji-mavic-3-pro').source, 'DJI Official Specs')
  assert.ok(merged.some((item) => item.id === 'skydio-x10'))
})

test('buildCandidatesFromCatalog continues with profile fallback when one source fails and another succeeds', async () => {
  const catalog = [
    {
      brand: 'DJI',
      name: 'Air 3',
      category: 'consumer',
      rfProfile: 'dji-o4-24-51-58',
      sourceUrl: 'https://example.com/air-3',
    },
    {
      brand: 'Autel',
      name: 'EVO Max 4T',
      category: 'industrial',
      rfProfile: 'autel-skylink-24-58',
      sourceUrl: 'https://example.com/evo-max-4t',
    },
  ]

  const candidates = await buildCandidatesFromCatalog(catalog, {
    allowFetchFailure: true,
    minSuccessfulFetches: 1,
    fetchImpl: async (url) => {
      if (String(url).includes('air-3')) {
        return {
          ok: true,
          text: async () => 'Operating Frequency 2.400-2.4835 GHz and 5.725-5.850 GHz. Video Transmission DJI O4.',
        }
      }
      throw new Error('source down')
    },
  })

  assert.equal(candidates.length, 2)
  assert.deepEqual(candidates[0].controlFreqMHz, [2400, 5800])
  assert.deepEqual(candidates[1].controlFreqMHz, [2400, 5800])
})

test('buildCandidatesFromCatalog throws when all monitored sources fail below the required success threshold', async () => {
  await assert.rejects(
    () => buildCandidatesFromCatalog([
      {
        brand: 'DJI',
        name: 'Air 3',
        category: 'consumer',
        rfProfile: 'dji-o4-24-51-58',
        sourceUrl: 'https://example.com/air-3',
      },
    ], {
      allowFetchFailure: true,
      minSuccessfulFetches: 1,
      fetchImpl: async () => {
        throw new Error('network down')
      },
    }),
    /Drone source health check failed/
  )
})
