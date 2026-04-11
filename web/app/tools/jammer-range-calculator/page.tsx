'use client'

import { useState } from 'react'
import Link from 'next/link'
import { drones } from '@/data/drones'

const C = 3e8

function calcJammerRange(
  powerW: number,
  gainDbi: number,
  freqMHz: number,
  sensitivityDbm: number,
): number {
  // R = (λ/4π) × √(Pj × Gj / P_min)
  const lambda = C / (freqMHz * 1e6)
  const Gj = Math.pow(10, gainDbi / 10)
  const P_min_W = Math.pow(10, (sensitivityDbm - 30) / 10)
  return (lambda / (4 * Math.PI)) * Math.sqrt((powerW * Gj) / P_min_W)
}

function fmt(m: number): string {
  if (m >= 1000) return (m / 1000).toFixed(2) + ' km'
  return Math.round(m) + ' m'
}

const FREQ_PRESETS = [
  { label: '433 MHz', value: 433 },
  { label: '868 / 915 MHz', value: 915 },
  { label: '2.4 GHz', value: 2400 },
  { label: '5.8 GHz', value: 5800 },
]

export default function JammerRangeCalculatorPage() {
  // Drone model selector
  const [selectedDroneId, setSelectedDroneId] = useState<string>('')
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(0)

  const [powerW, setPowerW] = useState<string>('10')
  const [gainDbi, setGainDbi] = useState<string>('6')
  const [freqMHz, setFreqMHz] = useState<string>('2400')
  const [sensitivityDbm, setSensitivityDbm] = useState<string>('-65')
  const [jammerBW, setJammerBW] = useState<string>('83')
  const [droneBW, setDroneBW] = useState<string>('2')

  const selectedDrone = drones.find((d) => d.id === selectedDroneId) ?? null

  function loadDroneModel(droneId: string) {
    const drone = drones.find((d) => d.id === droneId)
    if (!drone) { setSelectedDroneId(''); return }
    setSelectedDroneId(droneId)
    setSelectedBandIdx(0)
    setFreqMHz(String(drone.controlFreqMHz[0]))
    setDroneBW(String(drone.controlChannelBW_MHz))
  }

  function selectBand(idx: number) {
    if (!selectedDrone) return
    setSelectedBandIdx(idx)
    setFreqMHz(String(selectedDrone.controlFreqMHz[idx]))
  }

  const p = parseFloat(powerW)
  const g = parseFloat(gainDbi)
  const f = parseFloat(freqMHz)
  const s = parseFloat(sensitivityDbm)
  const jbw = parseFloat(jammerBW)
  const dbw = parseFloat(droneBW)
  const valid = p > 0 && f > 0 && !isNaN(g) && !isNaN(s) && jbw > 0 && dbw > 0

  // Effective jammer power after bandwidth dilution
  const bwPenaltyDb = valid && jbw > dbw ? 10 * Math.log10(dbw / jbw) : 0
  const pEff = valid ? p * (jbw > dbw ? dbw / jbw : 1) : p

  const range = valid ? calcJammerRange(pEff, g, f, s) : null
  const eirpDbm = valid ? 10 * Math.log10(p) + g + 30 : null
  const eirpEffDbm = valid ? 10 * Math.log10(pEff) + g + 30 : null

  // Power sweep
  const powers = [1, 5, 10, 20, 50, 100]

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-blue-600">Tools</Link>
        <span>/</span>
        <span className="text-gray-900">Jammer Range Calculator</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Jammer Effective Range Calculator</h1>
        <p className="text-gray-600 text-sm">
          Computes the maximum distance at which a jammer achieves sufficient power density to
          disrupt drone communications. Select a target drone model to auto-fill the operating
          frequency.
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
            <option value="">— Select a drone model to auto-fill frequency —</option>
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
              <p className="text-xs text-gray-500 mb-2">Select band to jam:</p>
              <div className="flex flex-wrap gap-2">
                {selectedDrone.controlFreqMHz.map((freq, i) => (
                  <button
                    key={freq}
                    onClick={() => selectBand(i)}
                    className={`text-xs px-3 py-1 rounded-full font-mono transition-colors ${
                      selectedBandIdx === i
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                    }`}
                  >
                    {freq >= 1000 ? (freq / 1000).toFixed(1) + ' GHz' : freq + ' MHz'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDrone && (
            <div className="text-xs bg-red-50 text-red-700 rounded px-3 py-2 space-y-1">
              <p><span className="font-semibold">{selectedDrone.name}</span> — GCS TX power: {selectedDrone.gcsTxPowerDbm} dBm</p>
              <p className="text-gray-500">
                To block this drone, your jammer must overcome {selectedDrone.gcsTxPowerDbm} dBm at the drone's location.
                Use the <Link href="/tools/js-ratio-calculator" className="underline hover:text-red-800">J/S Ratio Calculator</Link> to verify.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Jammer inputs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <h2 className="font-bold text-red-900 text-sm">Jammer Parameters</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Output Power (W)</label>
            <input type="number" min="0.1" step="0.1" value={powerW}
              onChange={(e) => setPowerW(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Antenna Gain (dBi)</label>
            <input type="number" step="0.5" value={gainDbi}
              onChange={(e) => setGainDbi(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
            <p className="text-xs text-gray-400 mt-1">Omnidirectional ≈ 0–3 dBi · Directional panel ≈ 9–14 dBi</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency (MHz)
              {selectedDrone && <span className="text-red-500 ml-1">— auto-filled from {selectedDrone.name}</span>}
            </label>
            <input type="number" min="1" value={freqMHz}
              onChange={(e) => setFreqMHz(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
            {!selectedDrone && (
              <div className="flex flex-wrap gap-2 mt-2">
                {FREQ_PRESETS.map((fp) => (
                  <button key={fp.value} onClick={() => setFreqMHz(String(fp.value))}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors">
                    {fp.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GCS Signal at Drone (dBm) — Jamming Threshold
            </label>
            <input type="number" step="1" value={sensitivityDbm}
              onChange={(e) => setSensitivityDbm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: 'DJI @ 200m', value: '-60' },
                { label: 'DJI @ 500m', value: '-66' },
                { label: 'DJI @ 1 km', value: '-72' },
                { label: 'Long-range @ 2 km', value: '-78' },
              ].map((p) => (
                <button key={p.value} onClick={() => setSensitivityDbm(p.value)}
                  className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors font-mono">
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Set to the estimated GCS signal level at the drone's location (J/S threshold = 0 dB).
              Use the <a href="/tools/js-ratio-calculator" className="underline hover:text-red-500">J/S Calculator</a> for a precise value from your specific geometry.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jammer Sweep Bandwidth (MHz)</label>
            <input type="number" min="0.1" step="0.5" value={jammerBW}
              onChange={(e) => setJammerBW(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex flex-wrap gap-2 mt-2">
              {[{l:'2.4 GHz ISM (83)',v:'83'},{l:'5.8 GHz ISM (150)',v:'150'},{l:'Wideband (200)',v:'200'},{l:'Spot (5)',v:'5'}].map((pr)=>(
                <button key={pr.v} onClick={()=>setJammerBW(pr.v)}
                  className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors">
                  {pr.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drone Control Channel Bandwidth (MHz)
              {selectedDrone && <span className="text-red-500 ml-1">— auto-filled from {selectedDrone.name}</span>}
            </label>
            <input type="number" min="0.1" step="0.1" value={droneBW}
              onChange={(e) => setDroneBW(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex flex-wrap gap-2 mt-2">
              {[{l:'FHSS/ELRS (0.5)',v:'0.5'},{l:'DJI O3/OcuSync (2)',v:'2'},{l:'Wi-Fi (20)',v:'20'}].map((pr)=>(
                <button key={pr.v} onClick={()=>setDroneBW(pr.v)}
                  className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors">
                  {pr.l}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">FHSS: bandwidth per hop · Wi-Fi: full channel width</p>
          </div>
        </div>
      </div>

      {/* Result */}
      {range !== null && eirpDbm !== null && eirpEffDbm !== null && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Effective Jamming Range</p>
              <p className="text-3xl font-bold text-red-800 font-mono">{fmt(range)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Rated EIRP</p>
              <p className="text-3xl font-bold text-red-700 font-mono">{eirpDbm.toFixed(1)} dBm</p>
            </div>
          </div>
          <div className="text-xs space-y-1 border-t border-red-200 pt-3 mt-3">
            {bwPenaltyDb < 0 ? (
              <p className="text-orange-700 font-semibold">
                Bandwidth penalty: {bwPenaltyDb.toFixed(1)} dB — jammer sweeps {jbw} MHz,
                drone channel is {dbw} MHz ({((dbw/jbw)*100).toFixed(1)}% of power is effective →
                effective EIRP: {eirpEffDbm.toFixed(1)} dBm)
              </p>
            ) : (
              <p className="text-green-700">Bandwidth: no penalty — jammer bandwidth ≤ channel bandwidth</p>
            )}
            {selectedDrone && (
              <p className="text-red-700">
                Against <span className="font-semibold">{selectedDrone.name}</span> (GCS: {selectedDrone.gcsTxPowerDbm} dBm, channel: {selectedDrone.controlChannelBW_MHz} MHz) —
                use <Link href="/tools/js-ratio-calculator" className="underline font-semibold">J/S Calculator</Link> to confirm effectiveness at specific geometry.
              </p>
            )}
            <p className="text-gray-500">Free-space model. Real-world range is typically 30–60% of this value.</p>
          </div>
        </div>
      )}

      {/* Power sweep table */}
      {valid && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 text-sm">
              Range vs Power — {g} dBi · {f >= 1000 ? (f / 1000).toFixed(1) + ' GHz' : f + ' MHz'} · BW {jbw}/{dbw} MHz (penalty {bwPenaltyDb.toFixed(1)} dB)
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500">Rated Power</th>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500">Eff. EIRP</th>
                <th className="px-6 py-2 text-right text-xs font-semibold text-gray-500">Effective Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {powers.map((pw) => {
                const pwEff = jbw > dbw ? pw * (dbw / jbw) : pw
                const r = calcJammerRange(pwEff, g, f, s)
                const eirpEff = 10 * Math.log10(pwEff) + g + 30
                return (
                  <tr key={pw} className={pw === p ? 'bg-red-50' : ''}>
                    <td className="px-6 py-2 font-mono text-gray-700">{pw} W</td>
                    <td className="px-6 py-2 font-mono text-gray-600">{eirpEff.toFixed(1)} dBm</td>
                    <td className="px-6 py-2 font-mono text-gray-900 text-right font-semibold">{fmt(r)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Formula */}
      <div className="text-sm text-gray-500 border-t border-gray-100 pt-6">
        <p className="font-medium text-gray-700 mb-1">Formula (Friis transmission)</p>
        <p className="font-mono text-xs bg-gray-50 rounded p-3 text-gray-700">
          R = (λ / 4π) × √(Pj × Gj / P_min)
        </p>
        <p className="mt-2 text-xs">
          λ = c/f · Gj = linear antenna gain · P_min = receiver sensitivity in watts.
          Drone receive antenna assumed omnidirectional (0 dBi).
        </p>
      </div>
    </main>
  )
}
