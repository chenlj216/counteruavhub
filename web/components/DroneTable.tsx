'use client'

import { useState, useMemo } from 'react'
import { drones, brands, categories, type DroneRecord, type DroneCategory } from '@/data/drones'

const FREQ_BANDS = ['433MHz', '868MHz', '900MHz', '2.4GHz', '5GHz', '5.8GHz', 'LTE'] as const

const CATEGORY_LABELS: Record<DroneCategory, string> = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  fpv: 'FPV',
  military: 'Military',
}

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  official: { label: 'Official', className: 'bg-green-100 text-green-800' },
  fcc: { label: 'FCC', className: 'bg-blue-100 text-blue-800' },
  'third-party': { label: '3rd Party', className: 'bg-yellow-100 text-yellow-800' },
}

function matchesBand(drone: DroneRecord, band: string): boolean {
  const haystack = [drone.controlFreq, drone.videoFreq, drone.gpsFreq].join(' ').toLowerCase()
  return haystack.includes(band.toLowerCase())
}

export default function DroneTable() {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<DroneCategory | ''>('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterBand, setFilterBand] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return drones.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.brand.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCategory && d.category !== filterCategory) return false
      if (filterBrand && d.brand !== filterBrand) return false
      if (filterBand && !matchesBand(d, filterBand)) return false
      return true
    })
  }, [search, filterCategory, filterBrand, filterBand])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search model or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as DroneCategory | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterBand}
          onChange={(e) => setFilterBand(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Frequency Bands</option>
          {FREQ_BANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-800">{filtered.length}</span> of {drones.length} records
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Model</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Control Freq</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Video Protocol</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Counter Freq</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Source</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No results found. Try adjusting your filters.</td>
              </tr>
            )}
            {filtered.map((drone) => (
              <>
                <tr
                  key={drone.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === drone.id ? null : drone.id)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{drone.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100">
                      {CATEGORY_LABELS[drone.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{drone.controlFreq}</td>
                  <td className="px-4 py-3 text-gray-700">{drone.videoProtocol}</td>
                  <td className="px-4 py-3 font-medium text-red-700">{drone.counterFreq}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SOURCE_BADGE[drone.sourceTier].className}`}>
                      {SOURCE_BADGE[drone.sourceTier].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {expanded === drone.id ? '▲' : '▼'}
                  </td>
                </tr>
                {expanded === drone.id && (
                  <tr key={`${drone.id}-detail`} className="bg-blue-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Video Frequency</p>
                          <p className="text-gray-800">{drone.videoFreq}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">GPS Frequency</p>
                          <p className="text-gray-800">{drone.gpsFreq}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Max TX Power</p>
                          <p className="text-gray-800">{drone.maxTxPower}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Data Source</p>
                          <p className="text-gray-800">
                            {drone.sourceUrl ? (
                              <a href={drone.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {drone.source}
                              </a>
                            ) : drone.source}
                          </p>
                        </div>
                        <div className="md:col-span-2 border-t pt-3 mt-1">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Counter-Drone Guidance</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-white rounded p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-blue-700 mb-1">Selecting jamming equipment?</p>
                              <p className="text-xs text-gray-600">Ensure coverage includes: <span className="font-medium">{drone.counterFreq}</span></p>
                            </div>
                            <div className="bg-white rounded p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-blue-700 mb-1">Configuring RF detection?</p>
                              <p className="text-xs text-gray-600">Scan range should include: <span className="font-medium">{drone.counterFreq}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 border-t pt-3">
        Data sourced from official specifications and public records. Always verify before deployment. Last updated April 2026.
      </p>
    </div>
  )
}
