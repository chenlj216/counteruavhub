export const DATASET_REVIEWED_LABEL = 'May 2026'

const CONFIDENCE_BY_TIER = {
  official: {
    label: 'Official / source-monitored',
    level: 'High',
    badgeClassName: 'bg-green-100 text-green-800',
    panelClassName: 'bg-green-50 border-green-200',
    note:
      'Collected from a manufacturer or monitored public source. Verify regional SKUs, firmware, and local documentation before engineering use.',
  },
  fcc: {
    label: 'FCC-backed',
    level: 'High',
    badgeClassName: 'bg-blue-100 text-blue-800',
    panelClassName: 'bg-blue-50 border-blue-200',
    note:
      'Matched to public regulatory filing evidence. RF behavior can still vary by region, firmware, payload, and operating mode.',
  },
  'third-party': {
    label: 'Public documentation / estimate',
    level: 'Needs verification',
    badgeClassName: 'bg-yellow-100 text-yellow-800',
    panelClassName: 'bg-yellow-50 border-yellow-200',
    note:
      'Based on public documentation or a conservative RF profile estimate. Verify against official documentation or controlled test data before use.',
  },
}

const ESTIMATE_PATTERNS = [
  /catalog rf profile/i,
  /fallback/i,
  /estimated/i,
  /public documentation/i,
  /product documentation/i,
]

export function isEstimatedSource(record) {
  if (!record) return true
  if (record.sourceTier === 'third-party') return true

  const source = String(record.source ?? '')
  return ESTIMATE_PATTERNS.some((pattern) => pattern.test(source))
}

export function getSourceConfidence(record) {
  if (isEstimatedSource(record)) return CONFIDENCE_BY_TIER['third-party']
  return CONFIDENCE_BY_TIER[record?.sourceTier] ?? CONFIDENCE_BY_TIER['third-party']
}
