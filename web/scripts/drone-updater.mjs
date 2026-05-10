import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RF_PROFILES = {
  'dji-o4-24-51-58': {
    controlFreq: '2.4GHz / 5.1GHz / 5.8GHz',
    videoProtocol: 'DJI O4',
    videoFreq: '2.4GHz / 5.1GHz / 5.8GHz',
    gpsFreq: 'GPS + Galileo + BeiDou',
    maxTxPower: '2.4GHz: <33dBm(FCC) · 5.8GHz: <33dBm(FCC)',
    counterFreq: '2.4GHz, 5.1GHz, 5.8GHz',
    controlFreqMHz: [2400, 5100, 5800],
    gcsTxPowerDbm: 26,
    controlChannelBW_MHz: 2,
  },
  'dji-o3-24-58': {
    controlFreq: '2.4GHz / 5.8GHz',
    videoProtocol: 'DJI O3',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS + Galileo + BeiDou',
    maxTxPower: '26 dBm (2.4GHz) / 26 dBm (5.8GHz)',
    counterFreq: '2.4GHz, 5.8GHz',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 26,
    controlChannelBW_MHz: 2,
  },
  'dji-ocusync-24-58': {
    controlFreq: '2.4GHz / 5.8GHz',
    videoProtocol: 'OcuSync',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS + GLONASS',
    maxTxPower: '26 dBm (2.4GHz) / 26 dBm (5.8GHz)',
    counterFreq: '2.4GHz, 5.8GHz',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 26,
    controlChannelBW_MHz: 2,
  },
  'wifi-24-58': {
    controlFreq: '2.4GHz / 5.8GHz',
    videoProtocol: 'Wi-Fi',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS / GLONASS',
    maxTxPower: '20-23 dBm typical',
    counterFreq: '2.4GHz, 5.8GHz',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 23,
    controlChannelBW_MHz: 20,
  },
  'autel-skylink-24-58': {
    controlFreq: '2.4GHz / 5.8GHz',
    videoProtocol: 'Autel SkyLink',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS + Galileo + BeiDou + GLONASS',
    maxTxPower: '26 dBm typical',
    counterFreq: '2.4GHz, 5.8GHz',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 26,
    controlChannelBW_MHz: 2,
  },
  'skydio-enterprise-24-58': {
    controlFreq: '2.4GHz / 5.8GHz',
    videoProtocol: 'Skydio Enterprise Controller link',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS + Galileo + GLONASS',
    maxTxPower: '26 dBm typical',
    counterFreq: '2.4GHz, 5.8GHz',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 26,
    controlChannelBW_MHz: 2,
  },
  'parrot-wifi-24-58': {
    controlFreq: '2.4GHz / 5.8GHz',
    videoProtocol: 'Wi-Fi / Parrot Skycontroller',
    videoFreq: '2.4GHz / 5.8GHz',
    gpsFreq: 'GPS + GLONASS',
    maxTxPower: '20-23 dBm typical',
    counterFreq: '2.4GHz, 5.8GHz',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 23,
    controlChannelBW_MHz: 20,
  },
  'industrial-24-58-lte': {
    controlFreq: '2.4GHz / 5.8GHz / LTE',
    videoProtocol: 'Enterprise controller / LTE optional',
    videoFreq: '2.4GHz / 5.8GHz / LTE',
    gpsFreq: 'GPS + Galileo + BeiDou + GLONASS',
    maxTxPower: '26 dBm typical',
    counterFreq: '2.4GHz, 5.8GHz, LTE bands',
    controlFreqMHz: [2400, 5800],
    gcsTxPowerDbm: 26,
    controlChannelBW_MHz: 2,
  },
  'subghz-24-58': {
    controlFreq: '868MHz / 915MHz / 2.4GHz / 5.8GHz',
    videoProtocol: 'Sub-GHz RC + 5.8GHz video',
    videoFreq: '5.8GHz',
    gpsFreq: 'GPS / GNSS',
    maxTxPower: '30 dBm typical',
    counterFreq: '868MHz, 915MHz, 2.4GHz, 5.8GHz',
    controlFreqMHz: [868, 915, 2400, 5800],
    gcsTxPowerDbm: 30,
    controlChannelBW_MHz: 1,
  },
}

const SOURCE_SCORE = {
  official: 3,
  fcc: 2,
  'third-party': 1,
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function slugifyDroneId(brand, name) {
  return `${brand} ${name}`
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

function bandsFromText(text) {
  const lower = text.toLowerCase()
  const bands = []
  if (/(433\s*mhz|433\.\d+\s*mhz)/i.test(text)) bands.push(433)
  if (/(868\s*mhz|863\s*-\s*870\s*mhz)/i.test(text)) bands.push(868)
  if (/(900\s*mhz|902\s*-\s*928\s*mhz|915\s*mhz)/i.test(text)) bands.push(915)
  if (/(1\.4\s*ghz|1427|1470)/i.test(text)) bands.push(1400)
  if (/(2\.4\s*ghz|2400|2\.400|2\.4835)/i.test(text)) bands.push(2400)
  if (/(5\.1\s*ghz|5150|5250|5\.150)/i.test(text)) bands.push(5100)
  if (/(5\.2\s*ghz|5250|5350|5\.250)/i.test(text)) bands.push(5200)
  if (/(5\.8\s*ghz|5725|5850|5\.725|5\.850)/i.test(text)) bands.push(5800)
  if (/(lte|4g|5g|cellular)/i.test(lower)) bands.push(0)
  return [...new Set(bands)].filter(Boolean).sort((a, b) => a - b)
}

function formatBands(mhz) {
  const label = (value) => {
    if (value < 1000) return `${value}MHz`
    if (value === 5100) return '5.1GHz'
    if (value === 5200) return '5.2GHz'
    if (value === 5800) return '5.8GHz'
    return `${Number(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}GHz`
  }
  return mhz.map(label).join(' / ')
}

function protocolFromText(text) {
  if (/O4\+?/i.test(text)) return /Enterprise/i.test(text) ? 'O4 Enterprise' : 'O4'
  if (/O3/i.test(text)) return /Enterprise/i.test(text) ? 'O3 Enterprise' : 'O3'
  if (/OcuSync\s*3/i.test(text)) return 'OcuSync 3.0'
  if (/OcuSync\s*2/i.test(text)) return 'OcuSync 2.0'
  if (/Lightbridge/i.test(text)) return 'Lightbridge'
  if (/SkyLink/i.test(text)) return 'Autel SkyLink'
  if (/Wi-?Fi/i.test(text)) return 'Wi-Fi'
  if (/LTE|cellular|4G|5G/i.test(text)) return 'Cellular / LTE'
  return undefined
}

function gnssFromText(text) {
  const systems = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS', 'NavIC'].filter((system) => new RegExp(system, 'i').test(text))
  return systems.length ? systems.join(' + ') : undefined
}

function txPowerFromText(text) {
  const matches = [...text.matchAll(/(?:<|≤|up to\s*)?(\d{2}(?:\.\d+)?)\s*dBm/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => value >= 10 && value <= 40)
  return matches.length ? Math.max(...matches) : undefined
}

export function extractSignalHints(text) {
  const clean = normalizeText(text)
  const controlFreqMHz = bandsFromText(clean)
  const txPower = txPowerFromText(clean)
  const protocol = protocolFromText(clean)
  const gnss = gnssFromText(clean)

  return {
    ...(controlFreqMHz.length ? {
      controlFreqMHz,
      controlFreq: formatBands(controlFreqMHz),
      videoFreq: formatBands(controlFreqMHz.filter((band) => band >= 2400)),
      counterFreq: controlFreqMHz.map((band) => (band < 1000 ? `${band}MHz` : formatBands([band]))).join(', '),
    } : {}),
    ...(protocol ? { videoProtocol: protocol } : {}),
    ...(gnss ? { gpsFreq: gnss } : {}),
    ...(txPower ? {
      maxTxPower: `${txPower} dBm detected from source text`,
      gcsTxPowerDbm: txPower,
    } : {}),
  }
}

export function buildDroneRecordFromCatalogEntry(entry, hints = {}) {
  const profile = RF_PROFILES[entry.rfProfile]
  if (!profile) {
    throw new Error(`Unknown RF profile: ${entry.rfProfile}`)
  }

  const id = entry.id || slugifyDroneId(entry.brand, entry.name)
  const sourceTier = entry.sourceTier || (entry.sourceUrl ? 'official' : 'third-party')
  const source = entry.source || `${entry.brand} source-monitored specs`

  return {
    id,
    name: `${entry.brand} ${entry.name}`.startsWith(entry.brand) ? entry.name : `${entry.brand} ${entry.name}`,
    brand: entry.brand,
    category: entry.category,
    ...profile,
    ...hints,
    source,
    sourceTier,
    ...(entry.sourceUrl ? { sourceUrl: entry.sourceUrl } : {}),
  }
}

export function mergeDroneRecords(existing, incoming) {
  const byId = new Map(existing.map((record) => [record.id, record]))

  for (const candidate of incoming) {
    const current = byId.get(candidate.id)
    if (!current) {
      byId.set(candidate.id, candidate)
      continue
    }

    const currentScore = SOURCE_SCORE[current.sourceTier] ?? 0
    const candidateScore = SOURCE_SCORE[candidate.sourceTier] ?? 0
    if (candidateScore > currentScore) {
      byId.set(candidate.id, { ...current, ...candidate })
    }
  }

  return [...byId.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))
}

export async function fetchText(url, fetchImpl = globalThis.fetch) {
  if (!url || !fetchImpl) return ''
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'CounterUAVHubBot/1.0 (+https://counteruavhub.com)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`)
    return response.text()
  } finally {
    clearTimeout(timeout)
  }
}

export async function buildCandidatesFromCatalog(catalog, { fetchImpl = globalThis.fetch, allowFetchFailure = false } = {}) {
  const candidates = []

  for (const entry of catalog) {
    let hints = {}
    if (entry.sourceUrl) {
      try {
        const text = await fetchText(entry.sourceUrl, fetchImpl)
        hints = extractSignalHints(text)
      } catch (error) {
        if (!allowFetchFailure) throw error
        console.warn(`Drone source fetch failed for ${entry.name}; using catalog profile. ${error.message}`)
      }
    }
    candidates.push(buildDroneRecordFromCatalogEntry(entry, hints))
  }

  return candidates
}

export async function updateDroneData({ existingRecords, catalog, fetchImpl, allowFetchFailure = false } = {}) {
  const candidates = await buildCandidatesFromCatalog(catalog, { fetchImpl, allowFetchFailure })
  return mergeDroneRecords(existingRecords, candidates)
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function scriptDir() {
  return path.dirname(fileURLToPath(import.meta.url))
}

export function defaultDronesJsonPath() {
  return path.resolve(scriptDir(), '..', 'data', 'drones.json')
}

export function defaultCatalogPath() {
  return path.resolve(scriptDir(), '..', 'data', 'drone-source-catalog.json')
}
