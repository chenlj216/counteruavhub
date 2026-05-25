import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { drones, DroneRecord } from '@/data/drones'
import { getBrandSlug } from '@/lib/brand-pages.mjs'
import { DATASET_REVIEWED_LABEL, getSourceConfidence, isEstimatedSource } from '@/lib/source-confidence.mjs'

export async function generateStaticParams() {
  return drones.map((d) => ({ slug: d.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const drone = drones.find((d) => d.id === slug)
  if (!drone) return {}
  return {
    title: `${drone.name} RF Frequency & Signal Parameters`,
    description: `Public RF signal parameters for the ${drone.name}. Control frequency: ${drone.controlFreq}, video protocol: ${drone.videoProtocol}, GNSS bands, and relevant counter-UAS planning bands.`,
    keywords: `${drone.name} frequency, ${drone.name} RF parameters, ${drone.brand} drone frequency, ${drone.name} signal, counter-UAS planning`,
    openGraph: {
      title: `${drone.name} RF Frequency & Signal Parameters`,
      description: `Control: ${drone.controlFreq} | Video: ${drone.videoProtocol} | RF planning bands: ${drone.counterFreq}`,
      type: 'article',
    },
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  fpv: 'FPV',
  military: 'Military',
}

const CATEGORY_COLOR: Record<string, string> = {
  consumer: 'bg-blue-100 text-blue-800',
  industrial: 'bg-purple-100 text-purple-800',
  fpv: 'bg-orange-100 text-orange-800',
  military: 'bg-red-100 text-red-800',
}

function RelatedDrones({ current }: { current: DroneRecord }) {
  const related = drones
    .filter((d) => d.id !== current.id && (d.brand === current.brand || d.category === current.category))
    .slice(0, 4)
  if (related.length === 0) return null
  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Related Models</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((d) => (
          <Link
            key={d.id}
            href={`/drones/${d.id}`}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <p className="font-semibold text-gray-900 text-sm">{d.name}</p>
            <p className="text-xs text-gray-500 mt-1">{d.controlFreq}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function DroneDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drone = drones.find((d) => d.id === slug)
  if (!drone) notFound()

  const confidence = getSourceConfidence(drone)
  const estimated = isEstimatedSource(drone)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${drone.name} RF Frequency & Signal Parameters`,
    description: `Control frequency: ${drone.controlFreq}, Video protocol: ${drone.videoProtocol}, relevant RF planning bands: ${drone.counterFreq}`,
    about: { '@type': 'Product', name: drone.name, brand: { '@type': 'Brand', name: drone.brand } },
    publisher: { '@type': 'Organization', name: 'CounterUAVHub', url: 'https://counteruavhub.com' },
  }

  const params_table = [
    { label: 'Control Frequency', value: drone.controlFreq },
    { label: 'Video Protocol', value: drone.videoProtocol },
    { label: 'Video Frequency', value: drone.videoFreq },
    { label: 'GPS Bands', value: drone.gpsFreq },
    { label: 'Max TX Power', value: drone.maxTxPower },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools/drone-frequency-database" className="hover:text-blue-600">Signal Database</Link>
        <span>/</span>
        <span className="text-gray-900">{drone.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Link href={`/brands/${getBrandSlug(drone.brand)}`} className="text-sm font-medium text-gray-500 hover:text-blue-600">
            {drone.brand}
          </Link>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[drone.category]}`}>
            {CATEGORY_LABEL[drone.category]}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confidence.badgeClassName}`}>
            {confidence.level}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{drone.name} — RF Signal Parameters</h1>
        <p className="mt-3 text-gray-600">
          Public RF frequency and signal parameters for the {drone.name}, including control link, video downlink, GPS bands, and relevant counter-UAS planning bands.
        </p>
      </div>

      {/* Signal Parameters */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Signal Parameters</h2>
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {params_table.map(({ label, value }) => (
              <tr key={label}>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 w-40">{label}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Counter-UAS Planning */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-red-500">⚡</span> Authorized Counter-UAS Planning Bands
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          For lawful RF monitoring, lab validation, or controlled counter-UAS planning, compare system coverage against these public reference bands:
        </p>
        <p className="font-mono text-base font-semibold text-red-800 bg-red-100 rounded-lg px-4 py-3">
          {drone.counterFreq}
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <p className="font-semibold text-gray-800 mb-1">RF Detection</p>
            <p className="text-gray-600">Configure scan range to include {drone.controlFreq} for signal identification.</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <p className="font-semibold text-gray-800 mb-1">Mitigation Planning</p>
            <p className="text-gray-600">Use {drone.counterFreq} as a reference for authorized coverage checks and compliance review.</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-red-100 flex flex-wrap gap-3">
          <Link
            href={`/tools/jammer-calculator?drone=${drone.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
          >
            Open RF Planning Calculator →
          </Link>
          <Link
            href={`/tools/rf-detection-coverage-planner?drone=${drone.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 bg-white border border-orange-200 hover:bg-orange-100 px-4 py-2 rounded-lg transition-colors"
          >
            Estimate RF Detection Coverage →
          </Link>
        </div>
      </div>

      {/* Source */}
      <div className="text-sm text-gray-500 border-t border-gray-100 pt-6 mb-8 space-y-4">
        <p>
          <span className="font-medium text-gray-700">Data source:</span> {drone.source}
          {drone.sourceUrl && (
            <>
              {' '}—{' '}
              <a href={drone.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View original spec
              </a>
            </>
          )}
        </p>
        <div className={`rounded-lg border p-4 ${confidence.panelClassName}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Data Confidence</p>
              <p className="font-semibold text-gray-900">{confidence.label}</p>
            </div>
            <span className={`self-start sm:self-center text-xs font-semibold px-2 py-0.5 rounded-full ${confidence.badgeClassName}`}>
              {confidence.level}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">{confidence.note}</p>
          <p className="text-xs text-gray-500 mt-1">Dataset reviewed: {DATASET_REVIEWED_LABEL}</p>
          {estimated && (
            <p className="text-xs text-yellow-800 mt-2">
              This record should be treated as a planning estimate until confirmed against official documentation or regulatory evidence.
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Always verify frequency data before field use. Specifications may vary by region, firmware version, antenna configuration, and operating mode.
        </p>
      </div>

      {/* Related */}
      <RelatedDrones current={drone} />

      {/* CTA */}
      <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
        <p className="font-semibold text-blue-900 mb-2">Looking for more drone models?</p>
        <p className="text-blue-700 text-sm mb-4">Search and filter RF parameters for {drones.length}+ drone models in our full Signal Database.</p>
        <Link
          href="/tools/drone-frequency-database"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Open Signal Database →
        </Link>
      </div>
    </main>
  )
}
