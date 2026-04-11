'use client'

import { useState } from 'react'
import Link from 'next/link'

function calcJS(
  jammerPowerW: number,
  jammerGainDbi: number,
  jammerDistM: number,
  signalPowerW: number,
  signalGainDbi: number,
  signalDistM: number,
): number {
  // J/S (dB) = EIRP_j(dBW) − EIRP_s(dBW) + 20·log10(Rs / Rj)
  const eirpJ = 10 * Math.log10(jammerPowerW) + jammerGainDbi
  const eirpS = 10 * Math.log10(signalPowerW) + signalGainDbi
  const geometryAdv = 20 * Math.log10(signalDistM / jammerDistM)
  return eirpJ - eirpS + geometryAdv
}

function verdict(js: number): { text: string; color: string; bg: string } {
  if (js >= 6) return { text: 'Effective Jamming', color: 'text-green-800', bg: 'bg-green-50 border-green-200' }
  if (js >= 0) return { text: 'Marginal — may not reliably disrupt', color: 'text-yellow-800', bg: 'bg-yellow-50 border-yellow-200' }
  return { text: 'Insufficient — signal dominates', color: 'text-red-800', bg: 'bg-red-50 border-red-200' }
}

export default function JSRatioCalculatorPage() {
  // Jammer
  const [jPow, setJPow] = useState<string>('10')
  const [jGain, setJGain] = useState<string>('6')
  const [jDist, setJDist] = useState<string>('500')
  // GCS (signal source)
  const [sPow, setSPow] = useState<string>('0.1')
  const [sGain, setSGain] = useState<string>('0')
  const [sDist, setSDist] = useState<string>('2000')

  const jp = parseFloat(jPow), jg = parseFloat(jGain), jd = parseFloat(jDist)
  const sp = parseFloat(sPow), sg = parseFloat(sGain), sd = parseFloat(sDist)
  const valid = [jp, jg, jd, sp, sg, sd].every((v) => !isNaN(v)) && jp > 0 && sp > 0 && jd > 0 && sd > 0

  const js = valid ? calcJS(jp, jg, jd, sp, sg, sd) : null
  const v = js !== null ? verdict(js) : null

  const InputField = ({
    label, value, onChange, hint, min, step,
  }: {
    label: string; value: string; onChange: (v: string) => void; hint?: string; min?: string; step?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number" min={min ?? '0'} step={step ?? 'any'} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-blue-600">Tools</Link>
        <span>/</span>
        <span className="text-gray-900">J/S Ratio Calculator</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Jamming-to-Signal (J/S) Ratio Calculator</h1>
        <p className="text-gray-600 text-sm">
          Evaluates whether a jammer has sufficient power advantage over the drone's control link
          at a given geometry. J/S ≥ 0 dB is the minimum threshold for disruption; ≥ 6 dB is
          considered reliable jamming.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Jammer */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <h2 className="font-bold text-red-900 text-sm">Jammer</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <InputField label="Output Power (W)" value={jPow} onChange={setJPow} min="0.01" />
            <InputField label="Antenna Gain (dBi)" value={jGain} onChange={setJGain}
              hint="Omni ≈ 0–3 dBi · Panel ≈ 9–14 dBi" step="0.5" />
            <InputField label="Distance to Drone (m)" value={jDist} onChange={setJDist}
              hint="Distance from jammer to drone target" />
          </div>
        </div>

        {/* Signal source (GCS) */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <h2 className="font-bold text-blue-900 text-sm">Ground Control Station (Signal Source)</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <InputField label="Output Power (W)" value={sPow} onChange={setSPow} min="0.001"
              hint="Typical RC/drone GCS: 0.025–0.1 W" />
            <InputField label="Antenna Gain (dBi)" value={sGain} onChange={setSGain}
              hint="Consumer GCS omni ≈ 0–2 dBi" step="0.5" />
            <InputField label="Distance to Drone (m)" value={sDist} onChange={setSDist}
              hint="Distance from GCS to drone" />
          </div>
        </div>
      </div>

      {/* Result */}
      {js !== null && v !== null && (
        <div className={`border rounded-xl p-6 mb-8 ${v.bg}`}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">J/S Ratio</p>
              <p className={`text-4xl font-bold font-mono ${v.color}`}>
                {js >= 0 ? '+' : ''}{js.toFixed(1)} dB
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Verdict</p>
              <p className={`text-base font-bold ${v.color} mt-2`}>{v.text}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Jammer EIRP: {(10 * Math.log10(jp) + jg + 30).toFixed(1)} dBm</p>
            <p>GCS EIRP: {(10 * Math.log10(sp) + sg + 30).toFixed(1)} dBm</p>
            <p>Geometry advantage (jammer closer): {(20 * Math.log10(sd / jd)).toFixed(1)} dB</p>
          </div>
        </div>
      )}

      {/* Interpretation guide */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-sm">J/S Ratio Interpretation</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-6 py-3 font-mono font-semibold text-green-700">≥ +6 dB</td>
              <td className="px-6 py-3 text-gray-700">Reliable jamming — jammer has clear power advantage</td>
            </tr>
            <tr>
              <td className="px-6 py-3 font-mono font-semibold text-yellow-700">0 to +6 dB</td>
              <td className="px-6 py-3 text-gray-700">Marginal — disruption is possible but not guaranteed</td>
            </tr>
            <tr>
              <td className="px-6 py-3 font-mono font-semibold text-red-700">{'< 0 dB'}</td>
              <td className="px-6 py-3 text-gray-700">Insufficient — control signal dominates, no effective jamming</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formula */}
      <div className="text-sm text-gray-500 border-t border-gray-100 pt-6">
        <p className="font-medium text-gray-700 mb-1">Formula</p>
        <p className="font-mono text-xs bg-gray-50 rounded p-3 text-gray-700">
          J/S (dB) = [10·log₁₀(Pj) + Gj] − [10·log₁₀(Ps) + Gs] + 20·log₁₀(Rs / Rj)
        </p>
        <p className="mt-2 text-xs">
          Pj/Ps = jammer/signal power in watts · Gj/Gs = antenna gains in dBi ·
          Rs = GCS-to-drone distance · Rj = jammer-to-drone distance.
          Assumes free-space propagation and identical frequency (jammer must be on-frequency).
        </p>
      </div>
    </main>
  )
}
