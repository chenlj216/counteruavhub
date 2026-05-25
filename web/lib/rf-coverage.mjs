export function dbmToW(dbm) {
  return Math.pow(10, (dbm - 30) / 10)
}

export function wToDbm(watts) {
  return 10 * Math.log10(watts) + 30
}

export function fsplDb(distanceKm, frequencyMHz) {
  return 32.44 + 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz)
}

export function receivedPowerDbm(input) {
  return (
    input.referenceEirpDbm +
    input.receiverGainDbi -
    fsplDb(input.distanceKm, input.frequencyMHz) -
    input.systemLossDb -
    input.environmentLossDb
  )
}

export function radioHorizonKm(sensorHeightM, emitterHeightM) {
  return 3.57 * (Math.sqrt(sensorHeightM) + Math.sqrt(emitterHeightM))
}

export const DEFAULT_DETECTION_BANDWIDTH_MHZ = 20

export function bandwidthPenaltyDb(
  signalBandwidthMHz = DEFAULT_DETECTION_BANDWIDTH_MHZ,
  referenceBandwidthMHz = DEFAULT_DETECTION_BANDWIDTH_MHZ,
) {
  const bandwidth = Math.max(0.001, signalBandwidthMHz)
  const referenceBandwidth = Math.max(0.001, referenceBandwidthMHz)
  return Math.max(0, 10 * Math.log10(bandwidth / referenceBandwidth))
}

export function linkBudgetRangeKm(input) {
  const requiredPowerDbm =
    input.receiverSensitivityDbm +
    input.requiredMarginDb +
    bandwidthPenaltyDb(input.signalBandwidthMHz)
  const maxFsplDb =
    input.referenceEirpDbm +
    input.receiverGainDbi -
    input.systemLossDb -
    input.environmentLossDb -
    requiredPowerDbm

  return Math.pow(10, (maxFsplDb - 32.44 - 20 * Math.log10(input.frequencyMHz)) / 20)
}

export function classifyConfidence({ sourceConfidenceLabel, marginDb, environmentLossDb }) {
  if (marginDb < 3 || environmentLossDb >= 18) return 'Low'
  if (/official|fcc/i.test(sourceConfidenceLabel) && marginDb >= 10 && environmentLossDb <= 10) return 'High'
  return 'Medium'
}

export function getLimitingFactor(result) {
  if (result.radioHorizonKm < result.linkBudgetRangeKm * 0.9) return 'Horizon-limited'
  if (result.environmentLossDb >= 18) return 'Environment-limited'
  if (result.targetMarginDb < 3) return 'Sensitivity-limited'
  return 'Balanced estimate'
}

export function calculateCoverage(input) {
  const linkRangeKm = Math.max(0, linkBudgetRangeKm(input))
  const horizonKm = radioHorizonKm(input.sensorHeightM, input.emitterHeightM)
  const effectiveRadiusKm = Math.min(linkRangeKm, horizonKm)
  const singleSensorAreaKm2 = Math.PI * Math.pow(effectiveRadiusKm, 2)
  const multiSensorAreaKm2 = singleSensorAreaKm2 * input.sensorCount * input.overlapFactor
  const targetRadiusKm = input.targetRadiusKm ?? effectiveRadiusKm
  const targetReceivedDbm = receivedPowerDbm({ ...input, distanceKm: Math.max(targetRadiusKm, 0.001) })
  const bandwidthAllowanceDb = bandwidthPenaltyDb(input.signalBandwidthMHz)
  const requiredPowerDbm = input.receiverSensitivityDbm + input.requiredMarginDb + bandwidthAllowanceDb
  const targetMarginDb = targetReceivedDbm - requiredPowerDbm

  const result = {
    frequencyMHz: input.frequencyMHz,
    signalBandwidthMHz: input.signalBandwidthMHz ?? DEFAULT_DETECTION_BANDWIDTH_MHZ,
    referenceEirpDbm: input.referenceEirpDbm,
    receiverSensitivityDbm: input.receiverSensitivityDbm,
    environmentLossDb: input.environmentLossDb,
    bandwidthPenaltyDb: bandwidthAllowanceDb,
    linkBudgetRangeKm: linkRangeKm,
    radioHorizonKm: horizonKm,
    effectiveRadiusKm,
    targetRadiusKm,
    targetReceivedDbm,
    requiredPowerDbm,
    targetMarginDb,
    singleSensorAreaKm2,
    multiSensorAreaKm2,
  }

  return {
    ...result,
    limitingFactor: getLimitingFactor(result),
    confidence: classifyConfidence({
      sourceConfidenceLabel: input.sourceConfidenceLabel,
      marginDb: targetMarginDb,
      environmentLossDb: input.environmentLossDb,
    }),
  }
}

export function formatKm(km) {
  if (km >= 10) return `${km.toFixed(1)} km`
  if (km >= 1) return `${km.toFixed(2)} km`
  return `${Math.round(km * 1000)} m`
}

export function formatArea(km2) {
  if (km2 >= 100) return `${km2.toFixed(0)} km²`
  if (km2 >= 10) return `${km2.toFixed(1)} km²`
  return `${km2.toFixed(2)} km²`
}
