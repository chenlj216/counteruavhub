import test from 'node:test'
import assert from 'node:assert/strict'

import {
  bandwidthPenaltyDb,
  calculateCoverage,
  classifyConfidence,
  dbmToW,
  DEFAULT_DETECTION_BANDWIDTH_MHZ,
  fsplDb,
  getLimitingFactor,
  radioHorizonKm,
  receivedPowerDbm,
  wToDbm,
} from '../lib/rf-coverage.mjs'

const baseInput = {
  frequencyMHz: 2400,
  signalBandwidthMHz: DEFAULT_DETECTION_BANDWIDTH_MHZ,
  referenceEirpDbm: 20,
  receiverSensitivityDbm: -95,
  receiverGainDbi: 6,
  systemLossDb: 2,
  environmentLossDb: 6,
  requiredMarginDb: 6,
  sensorHeightM: 10,
  emitterHeightM: 100,
  sensorCount: 1,
  overlapFactor: 0.75,
  sourceConfidenceLabel: 'Official / source-monitored',
}

test('dbmToW and wToDbm convert common RF power units', () => {
  assert.equal(dbmToW(30), 1)
  assert.equal(dbmToW(20), 0.1)
  assert.equal(wToDbm(1), 30)
  assert.equal(wToDbm(0.1), 20)
})

test('fsplDb returns the expected free-space path loss', () => {
  assert.equal(Number(fsplDb(1, 2400).toFixed(1)), 100.0)
  assert.equal(Number(fsplDb(10, 5800).toFixed(1)), 127.7)
})

test('receivedPowerDbm drops as distance increases', () => {
  const near = receivedPowerDbm({ ...baseInput, distanceKm: 1 })
  const far = receivedPowerDbm({ ...baseInput, distanceKm: 5 })

  assert.ok(near > far)
})

test('calculateCoverage increases range with better receiver sensitivity', () => {
  const normal = calculateCoverage(baseInput)
  const sensitive = calculateCoverage({ ...baseInput, receiverSensitivityDbm: -105 })

  assert.ok(sensitive.linkBudgetRangeKm > normal.linkBudgetRangeKm)
})

test('calculateCoverage reduces range when environment loss increases', () => {
  const open = calculateCoverage({ ...baseInput, environmentLossDb: 3 })
  const urban = calculateCoverage({ ...baseInput, environmentLossDb: 18 })

  assert.ok(open.effectiveRadiusKm > urban.effectiveRadiusKm)
})

test('radio horizon can limit effective range', () => {
  const coverage = calculateCoverage({
    ...baseInput,
    referenceEirpDbm: 50,
    receiverSensitivityDbm: -115,
    sensorHeightM: 2,
    emitterHeightM: 20,
  })

  assert.equal(coverage.effectiveRadiusKm, coverage.radioHorizonKm)
  assert.equal(getLimitingFactor(coverage), 'Horizon-limited')
})

test('calculateCoverage applies a conservative bandwidth allowance', () => {
  const baseline = calculateCoverage({ ...baseInput, signalBandwidthMHz: 20 })
  const wide = calculateCoverage({ ...baseInput, signalBandwidthMHz: 40 })

  assert.equal(DEFAULT_DETECTION_BANDWIDTH_MHZ, 20)
  assert.equal(Number(bandwidthPenaltyDb(20).toFixed(1)), 0)
  assert.equal(Number(bandwidthPenaltyDb(40).toFixed(1)), 3)
  assert.ok(baseline.linkBudgetRangeKm > wide.linkBudgetRangeKm)
  assert.equal(Number(wide.bandwidthPenaltyDb.toFixed(1)), 3)
})

test('calculateCoverage applies sensor count and overlap factor to area', () => {
  const single = calculateCoverage({ ...baseInput, sensorCount: 1, overlapFactor: 0.75 })
  const multi = calculateCoverage({ ...baseInput, sensorCount: 4, overlapFactor: 0.7 })

  assert.equal(
    Number(multi.multiSensorAreaKm2.toFixed(3)),
    Number((single.singleSensorAreaKm2 * 4 * 0.7).toFixed(3))
  )
})

test('classifyConfidence distinguishes high, medium, and low planning confidence', () => {
  assert.equal(
    classifyConfidence({
      sourceConfidenceLabel: 'Official / source-monitored',
      marginDb: 12,
      environmentLossDb: 6,
    }),
    'High'
  )
  assert.equal(
    classifyConfidence({
      sourceConfidenceLabel: 'Public documentation / estimate',
      marginDb: 8,
      environmentLossDb: 10,
    }),
    'Medium'
  )
  assert.equal(
    classifyConfidence({
      sourceConfidenceLabel: 'Public documentation / estimate',
      marginDb: 2,
      environmentLossDb: 18,
    }),
    'Low'
  )
})

test('radioHorizonKm follows the standard engineering approximation', () => {
  assert.equal(Number(radioHorizonKm(10, 100).toFixed(1)), 47.0)
})
