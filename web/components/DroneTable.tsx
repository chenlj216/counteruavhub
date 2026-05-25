'use client'

import Link from 'next/link'
import { Fragment, useState, useMemo } from 'react'
import { drones, brands, categories, type DroneRecord, type DroneCategory } from '@/data/drones'
import { trackEvent } from '@/lib/analytics.mjs'
import { DATASET_REVIEWED_LABEL, getSourceConfidence, isEstimatedSource } from '@/lib/source-confidence.mjs'

const FREQ_BANDS = ['433MHz', '868MHz', '900MHz', '2.4GHz', '5GHz', '5.8GHz', 'LTE'] as const

const CATEGORY_LABELS: Record<DroneCategory, string> = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  fpv: 'FPV',
  military: 'Military',
}

function matchesBand(drone: DroneRecord, band: string): boolean {
  const haystack = [drone.controlFreq, drone.videoFreq, drone.gpsFreq].join(' ').toLowerCase()
  return haystack.includes(band.toLowerCase())
}

function exportToCSV(data: DroneRecord[], filename: string) {
  const headers = ['Model', 'Brand', 'Category', 'Control Frequency', 'Video Protocol', 'Video Frequency', 'GPS Frequency', 'Max TX Power', 'Relevant RF Bands', 'Source', 'Source Confidence']
  const csvContent = [
    headers.join(','),
    ...data.map((drone) => {
      const confidence = getSourceConfidence(drone)

      return [
        `"${drone.name.replace(/"/g, '""')}"`,
        `"${drone.brand.replace(/"/g, '""')}"`,
        drone.category,
        `"${drone.controlFreq.replace(/"/g, '""')}"`,
        `"${drone.videoProtocol.replace(/"/g, '""')}"`,
        `"${drone.videoFreq.replace(/"/g, '""')}"`,
        `"${drone.gpsFreq.replace(/"/g, '""')}"`,
        `"${drone.maxTxPower.replace(/"/g, '""')}"`,
        `"${drone.counterFreq.replace(/"/g, '""')}"`,
        `"${drone.source.replace(/"/g, '""')}"`,
        `"${confidence.label.replace(/"/g, '""')}"`,
      ].join(',')
    }),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportToExcel(data: DroneRecord[], filename: string) {
  const headers = ['Model', 'Brand', 'Category', 'Control Frequency', 'Video Protocol', 'Video Frequency', 'GPS Frequency', 'Max TX Power', 'Relevant RF Bands', 'Source', 'Source Confidence']

  const rows = data.map((drone) => {
    const confidence = getSourceConfidence(drone)

    return [
      drone.name,
      drone.brand,
      drone.category,
      drone.controlFreq,
      drone.videoProtocol,
      drone.videoFreq,
      drone.gpsFreq,
      drone.maxTxPower,
      drone.counterFreq,
      drone.source,
      confidence.label,
    ]
  })

  const sheet = [headers, ...rows]
  const worksheet = sheet.map(row =>
    row.map(cell => {
      const str = String(cell ?? '')
      return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
    }).join('\t')
  ).join('\n')

  const blob = new Blob([worksheet], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
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

  function trackSearchCommit(value: string) {
    const searchTerm = value.trim()
    if (!searchTerm) return

    trackEvent('drone_database_search', {
      search_term: searchTerm,
      result_count: filtered.length,
    })
  }

  function updateCategory(value: DroneCategory | '') {
    setFilterCategory(value)
    trackEvent('drone_database_filter', {
      filter_type: 'category',
      filter_value: value || 'all',
    })
  }

  function updateBrand(value: string) {
    setFilterBrand(value)
    trackEvent('drone_database_filter', {
      filter_type: 'brand',
      filter_value: value || 'all',
    })
  }

  function updateBand(value: string) {
    setFilterBand(value)
    trackEvent('drone_database_filter', {
      filter_type: 'band',
      filter_value: value || 'all',
    })
  }

  function downloadCSV() {
    trackEvent('drone_database_export', {
      export_format: 'csv',
      record_count: filtered.length,
    })
    exportToCSV(filtered, `drone-database-${new Date().toISOString().split('T')[0]}.csv`)
  }

  function downloadExcel() {
    trackEvent('drone_database_export', {
      export_format: 'excel',
      record_count: filtered.length,
    })
    exportToExcel(filtered, `drone-database-${new Date().toISOString().split('T')[0]}.xls`)
  }

  function toggleExpanded(drone: DroneRecord) {
    const nextExpanded = expanded === drone.id ? null : drone.id
    setExpanded(nextExpanded)

    if (nextExpanded) {
      trackEvent('drone_database_record_open', {
        drone_id: drone.id,
        brand: drone.brand,
        category: drone.category,
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search model or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={(e) => trackSearchCommit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') trackSearchCommit(e.currentTarget.value)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => updateCategory(e.target.value as DroneCategory | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => updateBrand(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterBand}
          onChange={(e) => updateBand(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Frequency Bands</option>
          {FREQ_BANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Result count & Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-800">{filtered.length}</span> of {drones.length} records
        </p>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
          <button
            onClick={downloadExcel}
            disabled={filtered.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Model</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Control Freq</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Video Protocol</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Relevant Bands</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Confidence</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No results found. Try adjusting your filters.</td>
              </tr>
            )}
            {filtered.map((drone) => {
              const confidence = getSourceConfidence(drone)
              const estimated = isEstimatedSource(drone)

              return (
              <Fragment key={drone.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpanded(drone)}
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
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${confidence.badgeClassName}`}>
                      {confidence.level}
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
                              <a
                                href={drone.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent('drone_source_click', {
                                  drone_id: drone.id,
                                  source_tier: drone.sourceTier,
                                })}
                                className="text-blue-600 hover:underline"
                              >
                                {drone.source}
                              </a>
                            ) : drone.source}
                          </p>
                        </div>
                        <div className={`md:col-span-2 rounded p-3 border ${confidence.panelClassName}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Data Confidence</p>
                              <p className="text-sm font-semibold text-gray-900">{confidence.label}</p>
                            </div>
                            <span className={`self-start sm:self-center text-xs font-semibold px-2 py-0.5 rounded-full ${confidence.badgeClassName}`}>
                              {confidence.level}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">{confidence.note}</p>
                          <p className="text-xs text-gray-500 mt-1">Dataset reviewed: {DATASET_REVIEWED_LABEL}</p>
                          {estimated && (
                            <p className="text-xs text-yellow-800 mt-2">
                              Treat this row as a planning estimate until confirmed against an official or regulatory source.
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2 border-t pt-3 mt-1">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Authorized RF Planning</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-white rounded p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-blue-700 mb-1">Planning spectrum coverage?</p>
                              <p className="text-xs text-gray-600">Compare site-approved coverage against: <span className="font-medium">{drone.counterFreq}</span></p>
                            </div>
                            <div className="bg-white rounded p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-blue-700 mb-1">Configuring RF detection?</p>
                              <p className="text-xs text-gray-600">Scan range should include: <span className="font-medium">{drone.counterFreq}</span></p>
                            </div>
                          </div>
                          <Link
                            href={`/tools/rf-detection-coverage-planner?drone=${drone.id}`}
                            onClick={() => trackEvent('drone_database_tool_cta_click', {
                              drone_id: drone.id,
                              target_url: '/tools/rf-detection-coverage-planner',
                            })}
                            className="inline-flex mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Plan passive RF detection coverage →
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 border-t pt-3">
        Data sourced from official specifications, public records, and source-monitored RF profiles. Always verify before deployment.
      </p>
    </div>
  )
}
