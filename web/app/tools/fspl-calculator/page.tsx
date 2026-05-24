'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics.mjs'

function calcFSPL(distanceM: number, freqMHz: number): number {
  // FSPL (dB) = 20·log10(d_m) + 20·log10(f_Hz) − 147.55
  const f_Hz = freqMHz * 1e6
  return 20 * Math.log10(distanceM) + 20 * Math.log10(f_Hz) - 147.55
}

const FREQ_PRESETS = [
  { label: '433 MHz (ISM)', value: 433 },
  { label: '868 MHz (EU)', value: 868 },
  { label: '915 MHz (US ISM)', value: 915 },
  { label: '2.4 GHz (Wi-Fi/DJI)', value: 2400 },
  { label: '5.8 GHz (FPV/DJI)', value: 5800 },
]

export default function FSPLCalculatorPage() {
  const [distM, setDistM] = useState<string>('1000')
  const [freqMHz, setFreqMHz] = useState<string>('2400')

  const d = parseFloat(distM)
  const f = parseFloat(freqMHz)
  const valid = d > 0 && f > 0 && !isNaN(d) && !isNaN(f)

  // Real-time calculation
  const fspl = useMemo(() => {
    if (!valid) return null
    return calcFSPL(d, f)
  }, [d, f, valid])

  // Multi-distance table
  const distances = [100, 500, 1000, 2000, 5000, 10000]

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-blue-600">Tools</Link>
        <span>/</span>
        <span className="text-gray-900">FSPL Calculator</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Free Space Path Loss Calculator</h1>
        <p className="text-gray-600 text-sm">
          Computes RF signal attenuation in free space (Friis transmission model). Use this as a
          baseline for link budget analysis, jammer sizing, and RF sensor range planning.
        </p>
      </div>

      {/* Input card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-sm">Inputs</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (MHz)</label>
            <input
              type="number"
              min="1"
              value={freqMHz}
              onChange={(e) => setFreqMHz(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2400"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {FREQ_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setFreqMHz(String(p.value))
                    trackEvent('calculator_preset_click', {
                      calculator: 'fspl',
                      preset_type: 'frequency',
                      preset_value: String(p.value),
                    })
                  }}
                  className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distance (m)</label>
            <input
              type="number"
              min="1"
              value={distM}
              onChange={(e) => setDistM(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1000"
            />
          </div>
        </div>
      </div>

      {/* Result */}
      {valid && fspl !== null && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-600 mb-1">Free Space Path Loss</p>
          <p className="text-4xl font-bold text-purple-800 font-mono">{fspl.toFixed(1)} dB</p>
          <p className="text-xs text-gray-500 mt-2">
            At {(d >= 1000 ? (d / 1000).toFixed(2) + ' km' : d + ' m')} &nbsp;·&nbsp; {f >= 1000 ? (f / 1000).toFixed(2) + ' GHz' : f + ' MHz'}
          </p>
        </div>
      )}

      {/* Multi-distance table */}
      {valid && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 text-sm">
              FSPL vs Distance at {f >= 1000 ? (f / 1000).toFixed(2) + ' GHz' : f + ' MHz'}
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500">Distance</th>
                <th className="px-6 py-2 text-right text-xs font-semibold text-gray-500">FSPL (dB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {distances.map((dm) => (
                <tr key={dm} className={dm === d ? 'bg-purple-50' : ''}>
                  <td className="px-6 py-2 font-mono text-gray-700">
                    {dm >= 1000 ? (dm / 1000) + ' km' : dm + ' m'}
                  </td>
                  <td className="px-6 py-2 font-mono text-gray-900 text-right font-semibold">
                    {calcFSPL(dm, f).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formula */}
      <div className="text-sm text-gray-500 border-t border-gray-100 pt-6">
        <p className="font-medium text-gray-700 mb-1">Formula</p>
        <p className="font-mono text-xs bg-gray-50 rounded p-3 text-gray-700">
          FSPL (dB) = 20·log₁₀(d) + 20·log₁₀(f) − 147.55
        </p>
        <p className="mt-2 text-xs">where d is in meters, f is in Hz. Assumes isotropic antennas and no environmental losses.</p>
      </div>
    </main>
  )
}
