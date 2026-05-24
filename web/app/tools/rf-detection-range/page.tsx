'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics.mjs'

const C = 3e8

function calcDetectionRange(
  dronePowerW: number,
  droneGainDbi: number,
  freqMHz: number,
  rxSensDbm: number,
  rxGainDbi: number,
): number {
  // Friis: Pr = Pt × Gt × Gr × (λ/4πR)²  →  R = (λ/4π) × √(Pt×Gt×Gr / Pr_min)
  const lambda = C / (freqMHz * 1e6)
  const Gt = Math.pow(10, droneGainDbi / 10)
  const Gr = Math.pow(10, rxGainDbi / 10)
  const P_min_W = Math.pow(10, (rxSensDbm - 30) / 10)
  return (lambda / (4 * Math.PI)) * Math.sqrt((dronePowerW * Gt * Gr) / P_min_W)
}

function fmt(m: number): string {
  if (m >= 1000) return (m / 1000).toFixed(2) + ' km'
  return Math.round(m) + ' m'
}

const DRONE_PRESETS = [
  { label: 'DJI Mini (100 mW)', power: 0.1, gain: 0, freq: 2400 },
  { label: 'DJI Mavic 3 (200 mW)', power: 0.2, gain: 0, freq: 2400 },
  { label: 'FPV (250 mW, 5.8G)', power: 0.25, gain: 2, freq: 5800 },
  { label: 'Long-range (1 W, 900M)', power: 1, gain: 0, freq: 915 },
]

const RX_PRESETS = [
  { label: 'Wideband scanner (−85 dBm)', sens: -85, gain: 3 },
  { label: 'Dedicated C-UAS sensor (−100 dBm)', sens: -100, gain: 6 },
  { label: 'High-gain directional (−110 dBm)', sens: -110, gain: 15 },
]

export default function RFDetectionRangePage() {
  const [dronePow, setDronePow] = useState<string>('0.1')
  const [droneGain, setDroneGain] = useState<string>('0')
  const [freqMHz, setFreqMHz] = useState<string>('2400')
  const [rxSens, setRxSens] = useState<string>('-90')
  const [rxGain, setRxGain] = useState<string>('3')

  const dp = parseFloat(dronePow), dg = parseFloat(droneGain)
  const f = parseFloat(freqMHz)
  const rs = parseFloat(rxSens), rg = parseFloat(rxGain)
  const valid = dp > 0 && f > 0 && !isNaN(dg) && !isNaN(rs) && !isNaN(rg)

  // Real-time calculation
  const range = useMemo(() => {
    if (!valid) return null
    return calcDetectionRange(dp, dg, f, rs, rg)
  }, [dp, dg, f, rs, rg, valid])

  // Sensitivity sweep
  const sensLevels = [-75, -80, -85, -90, -95, -100, -110]

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-blue-600">Tools</Link>
        <span>/</span>
        <span className="text-gray-900">RF Detection Range</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">RF Detection Range Calculator</h1>
        <p className="text-gray-600 text-sm">
          Calculates the maximum distance at which a passive RF sensor can detect a drone&apos;s
          transmitter. Based on the Friis transmission equation with drone EIRP and receiver
          sensitivity as inputs.
        </p>
      </div>

      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
          <h2 className="font-bold text-orange-900 text-sm">Drone Transmitter</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2 mb-1">
            {DRONE_PRESETS.map((p) => (
              <button key={p.label}
                onClick={() => {
                  setDronePow(String(p.power)); setDroneGain(String(p.gain)); setFreqMHz(String(p.freq))
                  trackEvent('calculator_preset_click', {
                    calculator: 'rf_detection_range',
                    preset_type: 'drone_transmitter',
                    preset_value: p.label,
                  })
                }}
                className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-700 transition-colors">
                {p.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TX Power (W)</label>
            <input type="number" min="0.001" step="0.001" value={dronePow}
              onChange={(e) => setDronePow(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <p className="text-xs text-gray-400 mt-1">Typical consumer: 0.01–0.2 W · FPV: 0.025–1 W</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TX Antenna Gain (dBi)</label>
            <input type="number" step="0.5" value={droneGain}
              onChange={(e) => setDroneGain(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (MHz)</label>
            <input type="number" min="1" value={freqMHz}
              onChange={(e) => setFreqMHz(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <h2 className="font-bold text-blue-900 text-sm">RF Sensor (Receiver)</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2 mb-1">
            {RX_PRESETS.map((p) => (
              <button key={p.label}
                onClick={() => {
                  setRxSens(String(p.sens)); setRxGain(String(p.gain))
                  trackEvent('calculator_preset_click', {
                    calculator: 'rf_detection_range',
                    preset_type: 'receiver',
                    preset_value: p.label,
                  })
                }}
                className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Sensitivity (dBm)</label>
            <input type="number" step="1" value={rxSens}
              onChange={(e) => setRxSens(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Antenna Gain (dBi)</label>
            <input type="number" step="0.5" value={rxGain}
              onChange={(e) => setRxGain(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Result */}
      {valid && range !== null && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Max Detection Range</p>
              <p className="text-3xl font-bold text-orange-800 font-mono">{fmt(range)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Drone EIRP</p>
              <p className="text-3xl font-bold text-orange-700 font-mono">
                {(10 * Math.log10(dp) + dg + 30).toFixed(1)} dBm
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Free-space model. Real-world range depends on antenna orientation, terrain, and
            background RF noise. Obstructions can reduce range by 50–80%.
          </p>
        </div>
      )}

      {/* Sensitivity sweep table */}
      {valid && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 text-sm">Detection Range vs Receiver Sensitivity</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500">Sensitivity</th>
                <th className="px-6 py-2 text-right text-xs font-semibold text-gray-500">Detection Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sensLevels.map((s) => (
                <tr key={s} className={s === rs ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-2 font-mono text-gray-700">{s} dBm</td>
                  <td className="px-6 py-2 font-mono text-gray-900 text-right font-semibold">
                    {fmt(calcDetectionRange(dp, dg, f, s, rg))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formula */}
      <div className="text-sm text-gray-500 border-t border-gray-100 pt-6">
        <p className="font-medium text-gray-700 mb-1">Formula (Friis transmission)</p>
        <p className="font-mono text-xs bg-gray-50 rounded p-3 text-gray-700">
          R = (λ / 4π) × √(Pt × Gt × Gr / P_min)
        </p>
        <p className="mt-2 text-xs">
          λ = c/f · Gt = drone TX gain (linear) · Gr = receiver antenna gain (linear) ·
          P_min = receiver sensitivity in watts.
        </p>
      </div>
    </main>
  )
}
