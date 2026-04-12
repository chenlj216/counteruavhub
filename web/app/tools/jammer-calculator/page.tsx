'use client'

import { useState } from 'react'
import Link from 'next/link'
import { drones } from '@/data/drones'

const C = 3e8

function dbmToW(dbm: number): number {
  return Math.pow(10, (dbm - 30) / 10)
}

// GCS received power at drone location (dBm) — drone antenna assumed 0 dBi
function calcGCSAtDrone(spW: number, sGainDbi: number, sdM: number, freqMHz: number): number {
  const lambda = C / (freqMHz * 1e6)
  const sGain = Math.pow(10, sGainDbi / 10)
  const pW = spW * sGain * Math.pow(lambda / (4 * Math.PI * sdM), 2)
  return 10 * Math.log10(pW) + 30
}

// Max jamming range: distance at which jammer effective power equals GCS signal at drone (J/S = 0 dB)
function calcMaxRange(pEffW: number, jGainDbi: number, freqMHz: number, threshDbm: number): number {
  const lambda = C / (freqMHz * 1e6)
  const Gj = Math.pow(10, jGainDbi / 10)
  const P_min_W = Math.pow(10, (threshDbm - 30) / 10)
  return (lambda / (4 * Math.PI)) * Math.sqrt((pEffW * Gj) / P_min_W)
}

// J/S ratio in dB — pass pEff to include bandwidth penalty
function calcJS(jpW: number, jGain: number, jDist: number, spW: number, sGain: number, sDist: number): number {
  const eirpJ = 10 * Math.log10(jpW) + jGain
  const eirpS = 10 * Math.log10(spW) + sGain
  return eirpJ - eirpS + 20 * Math.log10(sDist / jDist)
}

function fmt(m: number): string {
  return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m'
}

function verdict(js: number): { label: string; color: string; border: string; bg: string } {
  if (js >= 6) return { label: 'Effective Jamming', color: 'text-green-800', border: 'border-green-200', bg: 'bg-green-50' }
  if (js >= 0) return { label: 'Marginal — may not reliably disrupt', color: 'text-yellow-800', border: 'border-yellow-200', bg: 'bg-yellow-50' }
  return { label: 'Insufficient — signal dominates', color: 'text-red-800', border: 'border-red-200', bg: 'bg-red-50' }
}

const FREQ_PRESETS = [
  { label: '433 MHz', v: '433' },
  { label: '915 MHz', v: '915' },
  { label: '2.4 GHz', v: '2400' },
  { label: '5.8 GHz', v: '5800' },
]
const JBW_PRESETS = [
  { label: '2.4 GHz ISM (83)', v: '83' },
  { label: '5.8 GHz ISM (150)', v: '150' },
  { label: 'Wideband (200)', v: '200' },
  { label: 'Spot (5)', v: '5' },
]
const DBW_PRESETS = [
  { label: 'ELRS/Crossfire (0.5)', v: '0.5' },
  { label: 'DJI O3 (2)', v: '2' },
  { label: 'Wi-Fi (20)', v: '20' },
]

const INPUT_CLS = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2'

type ResultSnapshot = {
  jp: number; jg: number; jd: number
  sp: number; sg: number; sd: number
  jbw: number; dbw: number; f: number
}

export default function JammerCalculatorPage() {
  const [selectedDroneId, setSelectedDroneId] = useState<string>('')
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(0)

  // Jammer
  const [jPow, setJPow] = useState<string>('10')
  const [jGain, setJGain] = useState<string>('6')
  const [jDist, setJDist] = useState<string>('500')
  const [jBW, setJBW] = useState<string>('83')
  const [freq, setFreq] = useState<string>('2400')

  // GCS
  const [sPow, setSPow] = useState<string>('0.1')
  const [sGain, setSGain] = useState<string>('2')
  const [sDist, setSDist] = useState<string>('1000')
  const [droneBW, setDroneBW] = useState<string>('2')

  // Calculation snapshot
  const [result, setResult] = useState<ResultSnapshot | null>(null)

  const selectedDrone = drones.find((d) => d.id === selectedDroneId) ?? null

  function loadDroneModel(droneId: string) {
    const drone = drones.find((d) => d.id === droneId)
    if (!drone) { setSelectedDroneId(''); return }
    setSelectedDroneId(droneId)
    setSelectedBandIdx(0)
    setFreq(String(drone.controlFreqMHz[0]))
    setSPow(String(dbmToW(drone.gcsTxPowerDbm).toFixed(4)))
    setSGain('2')
    setDroneBW(String(drone.controlChannelBW_MHz))
  }

  function selectBand(idx: number) {
    if (!selectedDrone) return
    setSelectedBandIdx(idx)
    setFreq(String(selectedDrone.controlFreqMHz[idx]))
  }

  const jp = parseFloat(jPow), jg = parseFloat(jGain), jd = parseFloat(jDist)
  const sp = parseFloat(sPow), sg = parseFloat(sGain), sd = parseFloat(sDist)
  const jbw = parseFloat(jBW), dbw = parseFloat(droneBW), f = parseFloat(freq)

  const valid =
    [jp, jg, jd, sp, sg, sd, jbw, dbw, f].every((x) => !isNaN(x)) &&
    jp > 0 && sp > 0 && jd > 0 && sd > 0 && jbw > 0 && dbw > 0 && f > 0

  function handleCalculate() {
    if (!valid) return
    setResult({ jp, jg, jd, sp, sg, sd, jbw, dbw, f })
  }

  const isDirty = result !== null && (
    result.jp !== jp || result.jg !== jg || result.jd !== jd ||
    result.sp !== sp || result.sg !== sg || result.sd !== sd ||
    result.jbw !== jbw || result.dbw !== dbw || result.f !== f
  )

  // All math from snapshot
  const r = result
  const bwPenaltyDb = r && r.jbw > r.dbw ? 10 * Math.log10(r.dbw / r.jbw) : 0
  const pEff = r ? (r.jbw > r.dbw ? r.jp * (r.dbw / r.jbw) : r.jp) : 0
  const gcsAtDroneDbm = r ? calcGCSAtDrone(r.sp, r.sg, r.sd, r.f) : null
  const js = r ? calcJS(pEff, r.jg, r.jd, r.sp, r.sg, r.sd) : null
  const maxRange = r && gcsAtDroneDbm !== null ? calcMaxRange(pEff, r.jg, r.f, gcsAtDroneDbm) : null
  const v = js !== null ? verdict(js) : null

  const powers = [1, 5, 10, 20, 50, 100]

  const btnCls = !valid
    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
    : isDirty
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : result
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white'

  const btnLabel = !valid
    ? 'Fill in all fields to calculate'
    : isDirty
    ? '⟳ Recalculate'
    : result
    ? 'Calculated ✓'
    : 'Calculate'

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-blue-600">Tools</Link>
        <span>/</span>
        <span className="text-gray-900">Jammer Effectiveness Calculator</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Jammer Effectiveness Calculator</h1>
        <p className="text-gray-600 text-sm">
          Unified J/S ratio and effective range analysis. Enter the scenario geometry to see both
          the jamming ratio at your current position and the maximum range at which jamming succeeds.
          Select a drone model to auto-fill GCS and frequency parameters.
        </p>
      </div>

      {/* Drone model selector */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-sm">Target Drone Model (optional)</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <select
            value={selectedDroneId}
            onChange={(e) => loadDroneModel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">— Select a drone model to auto-fill parameters —</option>
            {['consumer', 'industrial', 'fpv', 'military'].map((cat) => (
              <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                {drones.filter((d) => d.category === cat).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {selectedDrone && selectedDrone.controlFreqMHz.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Select band to analyze:</p>
              <div className="flex flex-wrap gap-2">
                {selectedDrone.controlFreqMHz.map((fq, i) => (
                  <button
                    key={fq}
                    onClick={() => selectBand(i)}
                    className={`text-xs px-3 py-1 rounded-full font-mono transition-colors ${
                      selectedBandIdx === i
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                    }`}
                  >
                    {fq >= 1000 ? (fq / 1000).toFixed(1) + ' GHz' : fq + ' MHz'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDrone && (
            <div className="text-xs bg-red-50 text-red-700 rounded px-3 py-2">
              <span className="font-semibold">{selectedDrone.name}</span>
              {' '}— GCS TX {selectedDrone.gcsTxPowerDbm} dBm
              · Channel BW {selectedDrone.controlChannelBW_MHz} MHz
              · Source: {selectedDrone.source}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {/* Jammer */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <h2 className="font-bold text-red-900 text-sm">Jammer</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output Power (W)</label>
              <input type="number" min="0.01" step="0.1" value={jPow}
                onChange={(e) => setJPow(e.target.value)}
                className={`${INPUT_CLS} focus:ring-red-400`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Antenna Gain (dBi)</label>
              <input type="number" step="0.5" value={jGain}
                onChange={(e) => setJGain(e.target.value)}
                className={`${INPUT_CLS} focus:ring-red-400`} />
              <p className="text-xs text-gray-400 mt-1">Omni ≈ 0–3 · Panel ≈ 9–14</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency (MHz)
                {selectedDrone && <span className="font-normal text-red-500 ml-1">— auto</span>}
              </label>
              <input type="number" min="1" value={freq}
                onChange={(e) => setFreq(e.target.value)}
                className={`${INPUT_CLS} focus:ring-red-400`} />
              {!selectedDrone && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {FREQ_PRESETS.map((fp) => (
                    <button key={fp.v} onClick={() => setFreq(fp.v)}
                      className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors">
                      {fp.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sweep Bandwidth (MHz)</label>
              <input type="number" min="0.1" step="0.5" value={jBW}
                onChange={(e) => setJBW(e.target.value)}
                className={`${INPUT_CLS} focus:ring-red-400`} />
              <div className="flex flex-wrap gap-1 mt-1">
                {JBW_PRESETS.map((p) => (
                  <button key={p.v} onClick={() => setJBW(p.v)}
                    className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance to Drone (m)</label>
              <input type="number" min="1" value={jDist}
                onChange={(e) => setJDist(e.target.value)}
                className={`${INPUT_CLS} focus:ring-red-400`} />
              <p className="text-xs text-gray-400 mt-1">Current jammer-to-drone distance — used to compute J/S at this geometry</p>
            </div>
          </div>
        </div>

        {/* GCS */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <h2 className="font-bold text-blue-900 text-sm">
              Ground Control Station
              {selectedDrone && <span className="font-normal ml-2 text-blue-600">— auto-filled from {selectedDrone.name}</span>}
            </h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TX Power (W)</label>
              <input type="number" min="0.001" step="any" value={sPow}
                onChange={(e) => setSPow(e.target.value)}
                className={`${INPUT_CLS} focus:ring-blue-500`} />
              <p className="text-xs text-gray-400 mt-1">Consumer: 0.025–0.1 W</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Antenna Gain (dBi)</label>
              <input type="number" step="0.5" value={sGain}
                onChange={(e) => setSGain(e.target.value)}
                className={`${INPUT_CLS} focus:ring-blue-500`} />
              <p className="text-xs text-gray-400 mt-1">Consumer omni ≈ 2 dBi</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance to Drone (m)</label>
              <input type="number" min="1" value={sDist}
                onChange={(e) => setSDist(e.target.value)}
                className={`${INPUT_CLS} focus:ring-blue-500`} />
              <p className="text-xs text-gray-400 mt-1">GCS-to-drone distance</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Control Channel BW (MHz)
                {selectedDrone && <span className="font-normal text-blue-600 ml-1">— auto</span>}
              </label>
              <input type="number" min="0.1" step="0.1" value={droneBW}
                onChange={(e) => setDroneBW(e.target.value)}
                className={`${INPUT_CLS} focus:ring-blue-500`} />
              <div className="flex flex-wrap gap-1 mt-1">
                {DBW_PRESETS.map((p) => (
                  <button key={p.v} onClick={() => setDroneBW(p.v)}
                    className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate button */}
      <button
        onClick={handleCalculate}
        disabled={!valid}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors mb-6 ${btnCls}`}
      >
        {btnLabel}
      </button>

      {/* Results */}
      {r !== null && js !== null && maxRange !== null && gcsAtDroneDbm !== null && v !== null && (
        <div className={`border rounded-xl overflow-hidden mb-6 ${isDirty ? 'opacity-60' : ''} ${v.border} ${v.bg}`}>
          {isDirty && (
            <div className="px-4 py-2 bg-orange-100 border-b border-orange-200 text-xs text-orange-700 font-medium">
              Inputs have changed — click Recalculate to update
            </div>
          )}
          <div className="grid grid-cols-2 divide-x divide-gray-200 p-6">
            <div className="pr-6">
              <p className="text-xs text-gray-500 mb-1">J/S Ratio at Scenario Geometry</p>
              <p className={`text-3xl font-bold font-mono ${v.color}`}>
                {js >= 0 ? '+' : ''}{js.toFixed(1)} <span className="text-lg">dB</span>
              </p>
              <p className={`text-sm font-semibold mt-1 ${v.color}`}>{v.label}</p>
            </div>
            <div className="pl-6">
              <p className="text-xs text-gray-500 mb-1">Max Jamming Range (J/S = 0 dB)</p>
              <p className="text-3xl font-bold font-mono text-gray-900">{fmt(maxRange)}</p>
              <p className={`text-sm mt-1 ${r.jd <= maxRange ? 'text-green-700' : 'text-red-600'}`}>
                {r.jd <= maxRange
                  ? `current position (${fmt(r.jd)}) is within range ✓`
                  : `move ${fmt(r.jd - maxRange)} closer to jam`}
              </p>
            </div>
          </div>
          <div className="px-6 pb-5 border-t border-gray-200 pt-3 text-xs space-y-1.5 text-gray-500">
            <p>
              Jammer EIRP (rated): {(10 * Math.log10(r.jp) + r.jg + 30).toFixed(1)} dBm
              {bwPenaltyDb < 0 && (
                <span className="text-orange-600 font-semibold">
                  {' '}→ effective {(10 * Math.log10(pEff) + r.jg + 30).toFixed(1)} dBm after BW penalty
                </span>
              )}
            </p>
            <p>GCS EIRP: {(10 * Math.log10(r.sp) + r.sg + 30).toFixed(1)} dBm</p>
            <p>GCS signal at drone: <span className="font-mono">{gcsAtDroneDbm.toFixed(1)} dBm</span> (Friis, {r.sd} m)</p>
            <p className={bwPenaltyDb < 0 ? 'text-orange-600 font-semibold' : ''}>
              Bandwidth penalty: {bwPenaltyDb.toFixed(1)} dB
              {bwPenaltyDb < 0
                ? ` — ${r.jbw} MHz sweep ÷ ${r.dbw} MHz channel = ${((r.dbw / r.jbw) * 100).toFixed(1)}% effective power`
                : ' — jammer BW ≤ channel BW, no dilution'}
            </p>
            <p>
              Geometry: jammer {fmt(r.jd)} · GCS {fmt(r.sd)} from drone
              {' '}({r.jd < r.sd ? '— jammer closer ✓' : '— GCS closer, jammer disadvantaged'})
            </p>
          </div>
        </div>
      )}

      {/* Power sweep table */}
      {r !== null && gcsAtDroneDbm !== null && (
        <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden mb-8 ${isDirty ? 'opacity-60' : ''}`}>
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 text-sm">
              Power Sweep — {r.jg} dBi · {r.f >= 1000 ? (r.f / 1000).toFixed(1) + ' GHz' : r.f + ' MHz'}
              {bwPenaltyDb < 0 && ` · BW penalty ${bwPenaltyDb.toFixed(1)} dB`}
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Rated Power</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Eff. EIRP</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">J/S @ {fmt(r.jd)}</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Max Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {powers.map((pw) => {
                const pwEff = r.jbw > r.dbw ? pw * (r.dbw / r.jbw) : pw
                const jsRow = calcJS(pwEff, r.jg, r.jd, r.sp, r.sg, r.sd)
                const rangeRow = calcMaxRange(pwEff, r.jg, r.f, gcsAtDroneDbm)
                const eirpEff = 10 * Math.log10(pwEff) + r.jg + 30
                const vRow = verdict(jsRow)
                return (
                  <tr key={pw} className={pw === r.jp ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-mono text-gray-700 font-semibold">{pw} W</td>
                    <td className="px-4 py-2 font-mono text-gray-500">{eirpEff.toFixed(1)} dBm</td>
                    <td className={`px-4 py-2 font-mono text-right ${vRow.color}`}>
                      {jsRow >= 0 ? '+' : ''}{jsRow.toFixed(1)} dB
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-900 text-right font-semibold">{fmt(rangeRow)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Interpretation */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-sm">J/S Ratio Reference</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-6 py-3 font-mono font-semibold text-green-700">≥ +6 dB</td>
              <td className="px-6 py-3 text-gray-700">Reliable jamming — jammer has clear power advantage</td>
            </tr>
            <tr>
              <td className="px-6 py-3 font-mono font-semibold text-yellow-700">0 to +6 dB</td>
              <td className="px-6 py-3 text-gray-700">Marginal — disruption possible but not guaranteed</td>
            </tr>
            <tr>
              <td className="px-6 py-3 font-mono font-semibold text-red-700">{'< 0 dB'}</td>
              <td className="px-6 py-3 text-gray-700">Insufficient — control signal dominates</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formulas */}
      <div className="text-sm text-gray-500 border-t border-gray-100 pt-6">
        <p className="font-medium text-gray-700 mb-2">Formulas</p>
        <div className="space-y-2">
          <p className="font-mono text-xs bg-gray-50 rounded p-3 text-gray-700">
            J/S (dB) = [10·log₁₀(Pj·Bc/Bj) + Gj] − [10·log₁₀(Ps) + Gs] + 20·log₁₀(Rs / Rj)
          </p>
          <p className="font-mono text-xs bg-gray-50 rounded p-3 text-gray-700">
            R_max = (λ/4π) × √(Pj·(Bc/Bj)·Gj / P_gcs_at_drone)
          </p>
        </div>
        <p className="mt-2 text-xs">
          Bc = drone control channel bandwidth · Bj = jammer sweep bandwidth · Rs = GCS-to-drone distance · Rj = jammer-to-drone distance.
          P_gcs_at_drone is computed from GCS parameters via Friis. All models assume free-space propagation and
          omnidirectional drone antenna (0 dBi). Real-world effective range is typically 30–60% of R_max.
        </p>
      </div>
    </main>
  )
}
