'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { drones, type DroneRecord } from '@/data/drones'
import { trackEvent } from '@/lib/analytics.mjs'
import { getSourceConfidence } from '@/lib/source-confidence.mjs'
import {
  calculateCoverage,
  DEFAULT_DETECTION_BANDWIDTH_MHZ,
  formatArea,
  formatKm,
  receivedPowerDbm,
} from '@/lib/rf-coverage.mjs'

type ScenarioPreset = {
  id: string
  label: string
  environmentLossDb: string
  sensorHeightM: string
  emitterHeightM: string
  overlapFactor: string
  note: string
}

type PlannerForm = {
  selectedDroneId: string
  emissionType: string
  frequencyMHz: string
  referenceEirpDbm: string
  signalBandwidthMHz: string
  receiverSensitivityDbm: string
  receiverGainDbi: string
  systemLossDb: string
  requiredMarginDb: string
  environmentLossDb: string
  sensorHeightM: string
  emitterHeightM: string
  sensorCount: string
  overlapFactor: string
  targetRadiusKm: string
}

type PlannerSnapshot = {
  form: PlannerForm
  drone: DroneRecord | null
  result: ReturnType<typeof calculateCoverage>
}

const INPUT_CLS = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400'
const SELECT_CLS = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'open-field',
    label: 'Open field',
    environmentLossDb: '3',
    sensorHeightM: '6',
    emitterHeightM: '100',
    overlapFactor: '0.85',
    note: 'Clear line-of-sight planning baseline for range tests and open terrain.',
  },
  {
    id: 'airport-perimeter',
    label: 'Airport perimeter',
    environmentLossDb: '6',
    sensorHeightM: '10',
    emitterHeightM: '120',
    overlapFactor: '0.75',
    note: 'Perimeter-style planning with moderate clutter and conservative overlap.',
  },
  {
    id: 'suburban-infrastructure',
    label: 'Suburban infrastructure',
    environmentLossDb: '10',
    sensorHeightM: '8',
    emitterHeightM: '80',
    overlapFactor: '0.7',
    note: 'Useful for campuses, utility sites, and low-rise industrial areas.',
  },
  {
    id: 'urban-critical',
    label: 'Urban critical infrastructure',
    environmentLossDb: '18',
    sensorHeightM: '15',
    emitterHeightM: '80',
    overlapFactor: '0.55',
    note: 'High-clutter estimate for dense urban RF and obstructed paths.',
  },
  {
    id: 'industrial-site',
    label: 'Industrial site',
    environmentLossDb: '15',
    sensorHeightM: '12',
    emitterHeightM: '80',
    overlapFactor: '0.65',
    note: 'Conservative setting for energy facilities, tanks, structures, and metallic clutter.',
  },
]

const RECEIVER_PRESETS = [
  { label: 'Wideband scanner', receiverSensitivityDbm: '-85', receiverGainDbi: '3', systemLossDb: '2' },
  { label: 'Dedicated C-UAS sensor', receiverSensitivityDbm: '-100', receiverGainDbi: '6', systemLossDb: '2' },
  { label: 'High-gain directional', receiverSensitivityDbm: '-110', receiverGainDbi: '15', systemLossDb: '3' },
]

const FREQUENCY_PRESETS = [
  { label: '433 MHz', frequencyMHz: '433' },
  { label: '915 MHz', frequencyMHz: '915' },
  { label: '2.4 GHz', frequencyMHz: '2400' },
  { label: '5.8 GHz', frequencyMHz: '5800' },
]

const DEFAULT_FORM: PlannerForm = {
  selectedDroneId: '',
  emissionType: 'Control link reference',
  frequencyMHz: '2400',
  referenceEirpDbm: '20',
  signalBandwidthMHz: String(DEFAULT_DETECTION_BANDWIDTH_MHZ),
  receiverSensitivityDbm: '-95',
  receiverGainDbi: '6',
  systemLossDb: '2',
  requiredMarginDb: '6',
  environmentLossDb: '6',
  sensorHeightM: '10',
  emitterHeightM: '100',
  sensorCount: '1',
  overlapFactor: '0.75',
  targetRadiusKm: '2',
}

function parsePositive(value: string, fallback: number) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getDroneFrequency(drone: DroneRecord | null) {
  return drone?.controlFreqMHz?.[0] ?? 2400
}

function getDroneFormValues(drone: DroneRecord) {
  return {
    selectedDroneId: drone.id,
    frequencyMHz: String(getDroneFrequency(drone)),
    referenceEirpDbm: String(drone.gcsTxPowerDbm),
    signalBandwidthMHz: String(estimateDetectionBandwidthMHz(drone)),
    emissionType: 'Control link reference',
  }
}

function estimateDetectionBandwidthMHz(drone: DroneRecord | null) {
  if (!drone) return DEFAULT_DETECTION_BANDWIDTH_MHZ

  const protocol = `${drone.videoProtocol} ${drone.controlFreq} ${drone.videoFreq}`.toLowerCase()

  if (/o3|o4|ocusync|lightbridge|skylink|wifi|wi-fi|hdzero|walksnail/.test(protocol)) return 20
  if (/analog fpv/.test(protocol)) return 8
  if (/expresslrs|elrs|crossfire|sub-ghz|subghz|433|868|915/.test(protocol)) return 1

  return Math.max(DEFAULT_DETECTION_BANDWIDTH_MHZ, drone.controlChannelBW_MHz)
}

function buildInput(form: PlannerForm, drone: DroneRecord | null) {
  const sourceConfidence = drone ? getSourceConfidence(drone).label : 'Public documentation / estimate'

  return {
    frequencyMHz: parsePositive(form.frequencyMHz, 2400),
    signalBandwidthMHz: parsePositive(form.signalBandwidthMHz, DEFAULT_DETECTION_BANDWIDTH_MHZ),
    referenceEirpDbm: parseNumber(form.referenceEirpDbm, 20),
    receiverSensitivityDbm: parseNumber(form.receiverSensitivityDbm, -95),
    receiverGainDbi: parseNumber(form.receiverGainDbi, 6),
    systemLossDb: parseNumber(form.systemLossDb, 2),
    environmentLossDb: parseNumber(form.environmentLossDb, 6),
    requiredMarginDb: parseNumber(form.requiredMarginDb, 6),
    sensorHeightM: parsePositive(form.sensorHeightM, 10),
    emitterHeightM: parsePositive(form.emitterHeightM, 100),
    sensorCount: Math.max(1, Math.round(parsePositive(form.sensorCount, 1))),
    overlapFactor: Math.min(1, Math.max(0.1, parsePositive(form.overlapFactor, 0.75))),
    targetRadiusKm: parsePositive(form.targetRadiusKm, 2),
    sourceConfidenceLabel: sourceConfidence,
  }
}

function buildSnapshot(form: PlannerForm): PlannerSnapshot {
  const drone = drones.find((item) => item.id === form.selectedDroneId) ?? null
  return {
    form,
    drone,
    result: calculateCoverage(buildInput(form, drone)),
  }
}

function fmtDb(value: number) {
  return `${value.toFixed(1)} dB`
}

function confidenceClass(confidence: string) {
  if (confidence === 'High') return 'bg-green-100 text-green-800'
  if (confidence === 'Medium') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function RFCoveragePlanner() {
  const [form, setForm] = useState<PlannerForm>(DEFAULT_FORM)
  const [snapshot, setSnapshot] = useState<PlannerSnapshot>(() => buildSnapshot(DEFAULT_FORM))
  const selectedDrone = useMemo(
    () => drones.find((drone) => drone.id === form.selectedDroneId) ?? null,
    [form.selectedDroneId]
  )
  const selectedScenario = SCENARIO_PRESETS.find((preset) => preset.environmentLossDb === form.environmentLossDb)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const droneId = params.get('drone')
    const drone = drones.find((item) => item.id === droneId)
    if (!drone) return

    const nextForm = { ...DEFAULT_FORM, ...getDroneFormValues(drone) }
    const timeout = window.setTimeout(() => {
      setForm(nextForm)
      setSnapshot(buildSnapshot(nextForm))
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [])

  function updateField(name: keyof PlannerForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function applyScenario(preset: ScenarioPreset) {
    const nextForm = {
      ...form,
      environmentLossDb: preset.environmentLossDb,
      sensorHeightM: preset.sensorHeightM,
      emitterHeightM: preset.emitterHeightM,
      overlapFactor: preset.overlapFactor,
    }
    setForm(nextForm)
    setSnapshot(buildSnapshot(nextForm))
    trackEvent('coverage_planner_preset_click', {
      preset_type: 'scenario',
      preset_value: preset.id,
    })
  }

  function applyReceiverPreset(preset: typeof RECEIVER_PRESETS[number]) {
    const nextForm = { ...form, ...preset }
    setForm(nextForm)
    setSnapshot(buildSnapshot(nextForm))
    trackEvent('coverage_planner_preset_click', {
      preset_type: 'receiver',
      preset_value: preset.label,
    })
  }

  function applyFrequencyPreset(frequencyMHz: string, label: string) {
    const nextForm = { ...form, frequencyMHz, selectedDroneId: '' }
    setForm(nextForm)
    setSnapshot(buildSnapshot(nextForm))
    trackEvent('coverage_planner_preset_click', {
      preset_type: 'frequency',
      preset_value: label,
    })
  }

  function loadDrone(droneId: string) {
    const drone = drones.find((item) => item.id === droneId)
    if (!drone) {
      updateField('selectedDroneId', '')
      return
    }
    const nextForm = { ...form, ...getDroneFormValues(drone) }
    setForm(nextForm)
    setSnapshot(buildSnapshot(nextForm))
    const confidence = getSourceConfidence(drone)
    trackEvent('coverage_planner_drone_select', {
      drone_id: drone.id,
      brand: drone.brand,
      category: drone.category,
      source_confidence: confidence.label,
    })
  }

  function calculate() {
    const nextSnapshot = buildSnapshot(form)
    setSnapshot(nextSnapshot)
    trackEvent('coverage_planner_calculate', {
      frequency_mhz: nextSnapshot.result.frequencyMHz,
      environment_preset: selectedScenario?.id ?? 'custom',
      sensor_count: buildInput(form, nextSnapshot.drone).sensorCount,
      effective_radius_km: Number(nextSnapshot.result.effectiveRadiusKm.toFixed(2)),
      confidence: nextSnapshot.result.confidence,
    })
  }

  function resetScenario() {
    setForm(DEFAULT_FORM)
    setSnapshot(buildSnapshot(DEFAULT_FORM))
  }

  const result = snapshot.result
  const sourceConfidence = snapshot.drone ? getSourceConfidence(snapshot.drone) : null
  const targetReceivedAtEffective = receivedPowerDbm({
    ...buildInput(snapshot.form, snapshot.drone),
    distanceKm: Math.max(result.effectiveRadiusKm, 0.001),
  })

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyScenario(preset)}
            className={`text-left border rounded-lg p-4 transition-colors ${
              form.environmentLossDb === preset.environmentLossDb
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50'
            }`}
          >
            <p className="font-semibold text-gray-900 text-sm">{preset.label}</p>
            <p className="text-xs text-gray-500 mt-2">{preset.note}</p>
            <p className="text-xs text-orange-700 mt-3">Loss {preset.environmentLossDb} dB</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
            <h2 className="font-bold text-orange-900 text-sm">Signal Source</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drone model preset</label>
              <select value={form.selectedDroneId} onChange={(event) => loadDrone(event.target.value)} className={SELECT_CLS}>
                <option value="">Custom signal source</option>
                {['consumer', 'industrial', 'fpv', 'military'].map((category) => (
                  <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {drones.filter((drone) => drone.category === category).map((drone) => (
                      <option key={drone.id} value={drone.id}>{drone.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedDrone && (
                <div className="mt-2 text-xs bg-orange-50 text-orange-800 rounded px-3 py-2">
                  <span className="font-semibold">{selectedDrone.name}</span>
                  {' '}uses reference EIRP {selectedDrone.gcsTxPowerDbm} dBm and estimated detection bandwidth {estimateDetectionBandwidthMHz(selectedDrone)} MHz.
                  {sourceConfidence && <span> Source confidence: {sourceConfidence.label}.</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emission type</label>
              <select value={form.emissionType} onChange={(event) => updateField('emissionType', event.target.value)} className={SELECT_CLS}>
                <option>Control link reference</option>
                <option>Video downlink reference</option>
                <option>Custom emitter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency presets</label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyFrequencyPreset(preset.frequencyMHz, preset.label)}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (MHz)</label>
                <input value={form.frequencyMHz} onChange={(event) => updateField('frequencyMHz', event.target.value)} type="number" min="1" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference EIRP (dBm)</label>
                <input value={form.referenceEirpDbm} onChange={(event) => updateField('referenceEirpDbm', event.target.value)} type="number" step="0.5" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupied / analysis BW (MHz)</label>
                <input value={form.signalBandwidthMHz} onChange={(event) => updateField('signalBandwidthMHz', event.target.value)} type="number" min="0.01" step="0.1" className={INPUT_CLS} />
                <p className="text-xs text-gray-400 mt-1">Use 10/20/40 MHz for DJI O3/O3+ planning; official model pages may not publish channel bandwidth.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h2 className="font-bold text-blue-900 text-sm">RF Sensor and Site Geometry</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {RECEIVER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyReceiverPreset(preset)}
                  className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver sensitivity (dBm)</label>
                <input value={form.receiverSensitivityDbm} onChange={(event) => updateField('receiverSensitivityDbm', event.target.value)} type="number" step="1" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver antenna gain (dBi)</label>
                <input value={form.receiverGainDbi} onChange={(event) => updateField('receiverGainDbi', event.target.value)} type="number" step="0.5" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cable / system loss (dB)</label>
                <input value={form.systemLossDb} onChange={(event) => updateField('systemLossDb', event.target.value)} type="number" min="0" step="0.5" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required margin (dB)</label>
                <input value={form.requiredMarginDb} onChange={(event) => updateField('requiredMarginDb', event.target.value)} type="number" min="0" step="0.5" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment loss (dB)</label>
                <input value={form.environmentLossDb} onChange={(event) => updateField('environmentLossDb', event.target.value)} type="number" min="0" step="0.5" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target radius (km)</label>
                <input value={form.targetRadiusKm} onChange={(event) => updateField('targetRadiusKm', event.target.value)} type="number" min="0.1" step="0.1" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sensor height (m)</label>
                <input value={form.sensorHeightM} onChange={(event) => updateField('sensorHeightM', event.target.value)} type="number" min="1" step="1" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emitter height (m)</label>
                <input value={form.emitterHeightM} onChange={(event) => updateField('emitterHeightM', event.target.value)} type="number" min="1" step="1" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sensor count</label>
                <input value={form.sensorCount} onChange={(event) => updateField('sensorCount', event.target.value)} type="number" min="1" step="1" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overlap factor</label>
                <input value={form.overlapFactor} onChange={(event) => updateField('overlapFactor', event.target.value)} type="number" min="0.1" max="1" step="0.05" className={INPUT_CLS} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={calculate}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-3 rounded-lg text-sm transition-colors"
        >
          Calculate Coverage
        </button>
        <button
          onClick={resetScenario}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-3 rounded-lg text-sm transition-colors"
        >
          Reset Scenario
        </button>
      </div>

      <section className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-orange-700 font-semibold mb-1">Coverage Result</p>
            <h2 className="text-2xl font-bold text-gray-900">Effective radius: {formatKm(result.effectiveRadiusKm)}</h2>
            <p className="text-sm text-gray-600 mt-2">
              Based on {snapshot.form.emissionType.toLowerCase()} at {result.frequencyMHz} MHz, {result.signalBandwidthMHz} MHz occupied / analysis bandwidth, and a required margin of {snapshot.form.requiredMarginDb} dB.
            </p>
          </div>
          <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full ${confidenceClass(result.confidence)}`}>
            {result.confidence} confidence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Link-budget range</p>
            <p className="font-mono text-lg font-bold text-gray-900">{formatKm(result.linkBudgetRangeKm)}</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Radio horizon</p>
            <p className="font-mono text-lg font-bold text-gray-900">{formatKm(result.radioHorizonKm)}</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Target margin</p>
            <p className="font-mono text-lg font-bold text-gray-900">{fmtDb(result.targetMarginDb)}</p>
            <p className="text-xs text-gray-500 mt-1">Includes {fmtDb(result.bandwidthPenaltyDb)} bandwidth allowance</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Limiting factor</p>
            <p className="font-semibold text-sm text-gray-900">{result.limitingFactor}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Single-sensor area</p>
            <p className="font-mono text-xl font-bold text-gray-900">{formatArea(result.singleSensorAreaKm2)}</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Multi-sensor area</p>
            <p className="font-mono text-xl font-bold text-gray-900">{formatArea(result.multiSensorAreaKm2)}</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Received power at effective radius</p>
            <p className="font-mono text-xl font-bold text-gray-900">{targetReceivedAtEffective.toFixed(1)} dBm</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-orange-100 p-4 text-sm text-gray-600 leading-6">
          <p>
            This is a first-order engineering estimate. Passive RF detection depends on active emissions,
            antenna placement, local noise, terrain, protocol behavior, and receiver implementation.
            Frequency references alone do not identify a drone or guarantee detection.
          </p>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
            <li>Verify site noise floor with spectrum survey data.</li>
            <li>Confirm antenna height, pattern, polarization, and feeder loss.</li>
            <li>Check official or regulatory references for the selected model.</li>
            <li>Validate coverage with controlled field testing before deployment.</li>
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/tools/rf-detection-range"
          onClick={() => trackEvent('coverage_planner_result_cta_click', { cta_type: 'simple_range', target_url: '/tools/rf-detection-range' })}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <p className="font-semibold text-gray-900 text-sm">Need a simpler range estimate?</p>
          <p className="text-xs text-gray-500 mt-2">Open the original RF Detection Range Calculator.</p>
        </Link>
        <Link
          href="/tools/fspl-calculator"
          onClick={() => trackEvent('coverage_planner_result_cta_click', { cta_type: 'fspl', target_url: '/tools/fspl-calculator' })}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <p className="font-semibold text-gray-900 text-sm">Review the path-loss baseline</p>
          <p className="text-xs text-gray-500 mt-2">Use FSPL to inspect the propagation model.</p>
        </Link>
        <Link
          href="/tools/drone-frequency-database"
          onClick={() => trackEvent('coverage_planner_result_cta_click', { cta_type: 'database', target_url: '/tools/drone-frequency-database' })}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <p className="font-semibold text-gray-900 text-sm">Compare drone RF data</p>
          <p className="text-xs text-gray-500 mt-2">Return to the signal database for source details.</p>
        </Link>
      </section>
    </div>
  )
}
