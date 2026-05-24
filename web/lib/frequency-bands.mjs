const CATEGORY_LABELS = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  fpv: 'FPV',
  military: 'Military',
}

export const FREQUENCY_BANDS = [
  {
    slug: '2-4ghz',
    label: '2.4GHz Drone Frequencies',
    shortLabel: '2.4GHz',
    title: '2.4GHz Drone Frequency Guide',
    description:
      '2.4GHz is one of the most common bands for consumer and enterprise drone control links, video transmission, and Wi-Fi-based UAV connectivity.',
    matchers: ['2.4ghz', '2.400', '2.4835', '2400'],
    numericRangesMHz: [[2300, 2500]],
    primaryUse: 'Control links, telemetry, Wi-Fi-based links, and some digital video systems.',
    detectionNote:
      'RF detection systems should treat 2.4GHz as a core watch band, but classification requires protocol behavior and timing, not frequency alone.',
    counterUasNote:
      'Counter-UAS planning should verify exact regional limits and deployment authority before acting on 2.4GHz assumptions.',
  },
  {
    slug: '5-8ghz',
    label: '5.8GHz Drone Frequencies',
    shortLabel: '5.8GHz',
    title: '5.8GHz Drone Frequency Guide',
    description:
      '5.8GHz is widely used by FPV video links, DJI/Autel-style digital video systems, and short-range high-throughput drone links.',
    matchers: ['5.8ghz', '5.725', '5.850', '5800', '5ghz'],
    numericRangesMHz: [[5100, 5900]],
    primaryUse: 'Video downlinks, short-range command links, FPV systems, and high-throughput digital transmission.',
    detectionNote:
      '5.8GHz links can be directional, low-altitude, and short-burst; detection coverage benefits from antenna placement and spectrum visibility.',
    counterUasNote:
      'Operational countermeasures must account for bandwidth dilution, antenna gain, and local legal constraints rather than treating 5.8GHz as a single fixed channel.',
  },
  {
    slug: 'gnss',
    label: 'GNSS Drone Navigation Frequencies',
    shortLabel: 'GNSS',
    title: 'GNSS Drone Navigation Frequency Guide',
    description:
      'GNSS bands such as GPS L1/L2/L5, Galileo, GLONASS, and BeiDou support positioning, return-to-home, geofencing, and RTK navigation.',
    matchers: ['gps', 'gnss', 'galileo', 'glonass', 'beidou', 'rtk', 'l1', 'l2', 'l5'],
    numericRangesMHz: [[1160, 1615]],
    primaryUse: 'Navigation, timing, geofencing, RTK positioning, return-to-home behavior, and mission stability.',
    detectionNote:
      'GNSS fields are useful for risk analysis, but passive RF drone detection usually depends more on control and video emissions.',
    counterUasNote:
      'GNSS jamming and spoofing are sensitive, highly regulated topics; this page keeps discussion at planning and safety-awareness level.',
  },
]

export function getFrequencyBand(slug) {
  return FREQUENCY_BANDS.find((band) => band.slug === slug) ?? null
}

function textMatchesBand(drone, band) {
  const haystack = [drone.controlFreq, drone.videoFreq, drone.gpsFreq, drone.counterFreq]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return band.matchers.some((matcher) => haystack.includes(matcher.toLowerCase()))
}

function numericMatchesBand(drone, band) {
  const frequencies = Array.isArray(drone.controlFreqMHz) ? drone.controlFreqMHz : []

  return frequencies.some((freqMHz) =>
    band.numericRangesMHz.some(([min, max]) => freqMHz >= min && freqMHz <= max)
  )
}

export function filterDronesForBand(drones, slug) {
  const band = getFrequencyBand(slug)
  if (!band) return []

  return drones.filter((drone) => textMatchesBand(drone, band) || numericMatchesBand(drone, band))
}

function countBy(items, getKey) {
  const counts = new Map()
  for (const item of items) {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function summarizeBandDrones(drones) {
  return {
    total: drones.length,
    categories: countBy(drones, (drone) => CATEGORY_LABELS[drone.category] ?? drone.category),
    topBrands: countBy(drones, (drone) => drone.brand).slice(0, 6),
  }
}
